const { z } = require('zod');
const Concept = require('../models/Concept');
const Subject = require('../models/Subject');
const UserProgress = require('../models/UserProgress');
const Attempt = require('../models/Attempt');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const graphService = require('../services/graphService');
const { loadProgressMap, statusOf, recommendNext } = require('../services/recommendationService');
const { statusFor } = require('../services/assessmentService');

const updateSchema = z.object({
  completed: z.boolean().optional(),
  masteryScore: z.number().min(0).max(100).optional(),
}).refine((v) => v.completed !== undefined || v.masteryScore !== undefined, 'Provide completed or masteryScore');

const getProgress = asyncHandler(async (req, res) => {
  const rows = await UserProgress.find({ userId: req.user._id }).lean();
  const concepts = await Concept.find({ _id: { $in: rows.map((r) => r.conceptId) } }).lean();
  const names = new Map(concepts.map((c) => [String(c._id), c]));
  res.json(rows.map((r) => ({
    conceptId: r.conceptId,
    concept: names.get(String(r.conceptId))?.name,
    subjectId: names.get(String(r.conceptId))?.subjectId,
    masteryScore: r.masteryScore,
    status: statusOf(r, req.user.masteryThreshold),
    completed: r.completed,
    lastAssessedAt: r.lastAssessedAt,
  })));
});

// Manually mark a concept complete (or set a score). Learning paths are recalculated on every request.
const updateProgress = asyncHandler(async (req, res) => {
  const concept = await Concept.findById(req.params.conceptId).lean();
  if (!concept) throw new HttpError(404, 'Concept not found');
  const threshold = req.user.masteryThreshold;
  const existing = await UserProgress.findOne({ userId: req.user._id, conceptId: concept._id }).lean();
  const score = existing ? existing.masteryScore : 0;
  let { completed, masteryScore } = req.body;
  let set;
  if (masteryScore !== undefined) {
    const status = statusFor(masteryScore, threshold);
    set = { masteryScore, status, completed: completed ?? status === 'mastered', lastAssessedAt: new Date() };
  } else if (completed) {
    set = { masteryScore: Math.max(score, threshold), status: 'mastered', completed: true };
  } else {
    // un-completing drops the concept back below the threshold
    set = { masteryScore: Math.min(score, threshold - 1), status: 'weak', completed: false };
  }
  const progress = await UserProgress.findOneAndUpdate(
    { userId: req.user._id, conceptId: concept._id }, { $set: set }, { returnDocument: 'after', upsert: true }
  ).lean();
  res.json(progress);
});

const getLearningPath = asyncHandler(async (req, res) => {
  const out = await graphService.generateLearningPath(req.params.targetId, req.user);
  if (!out) throw new HttpError(404, 'Target concept not found');
  res.json(out);
});

const getAttempts = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ userId: req.user._id }).lean();
  attempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const concepts = await Concept.find({ _id: { $in: attempts.map((a) => a.conceptId) } }).lean();
  const names = new Map(concepts.map((c) => [String(c._id), c.name]));
  res.json(attempts.slice(0, 50).map((a) => ({ ...a, concept: names.get(String(a.conceptId)) })));
});

// Overview for the dashboard: per-subject progress, weak concepts, what to study next, recent attempts.
const getDashboard = asyncHandler(async (req, res) => {
  const threshold = req.user.masteryThreshold;
  const progress = await loadProgressMap(req.user._id);
  const subjects = await Subject.find().lean();
  const out = [];
  const weak = [];
  for (const subject of subjects) {
    const { graph, concepts } = await graphService.buildGraph(subject._id);
    const byId = new Map(concepts.map((c) => [String(c._id), c]));
    const order = graphService.topologicalSort(graph, undefined, (a, b) => byId.get(a).name.localeCompare(byId.get(b).name));
    const counts = { mastered: 0, weak: 0, unassessed: 0 };
    for (const id of order) {
      const st = statusOf(progress.get(id), threshold);
      counts[st]++;
      if (st === 'weak') weak.push({ conceptId: id, concept: byId.get(id).name, subject: subject.name, masteryScore: progress.get(id).masteryScore });
    }
    out.push({
      subject,
      total: order.length,
      ...counts,
      percentMastered: order.length ? Math.round((counts.mastered / order.length) * 100) : 0,
      next: recommendNext(graph, order, byId, progress, threshold, 5),
    });
  }
  const attempts = await Attempt.find({ userId: req.user._id }).lean();
  attempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recent = attempts.slice(0, 5);
  const rc = await Concept.find({ _id: { $in: recent.map((a) => a.conceptId) } }).lean();
  const names = new Map(rc.map((c) => [String(c._id), c.name]));
  res.json({
    threshold,
    subjects: out,
    weakConcepts: weak,
    recentAttempts: recent.map((a) => ({ ...a, concept: names.get(String(a.conceptId)) })),
  });
});

module.exports = { getProgress, updateProgress, getLearningPath, getAttempts, getDashboard, updateSchema };
