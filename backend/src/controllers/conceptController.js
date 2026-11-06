const { z } = require('zod');
const Concept = require('../models/Concept');
const Subject = require('../models/Subject');
const Dependency = require('../models/Dependency');
const Quiz = require('../models/Quiz');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const graphService = require('../services/graphService');
const { sanitizeQuiz } = require('../services/assessmentService');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const conceptSchema = z.object({
  subjectId: objectId,
  name: z.string().trim().min(1),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedHours: z.number().min(0).optional(),
});
const dependencySchema = z.object({ prerequisiteId: objectId, conceptId: objectId });

const getConcept = asyncHandler(async (req, res) => {
  const concept = await Concept.findById(req.params.id).lean();
  if (!concept) throw new HttpError(404, 'Concept not found');
  const [pre, dep] = await Promise.all([
    Dependency.find({ conceptId: concept._id }).lean(),
    Dependency.find({ prerequisiteId: concept._id }).lean(),
  ]);
  const ids = [...pre.map((d) => d.prerequisiteId), ...dep.map((d) => d.conceptId)];
  const related = await Concept.find({ _id: { $in: ids } }).lean();
  const byId = new Map(related.map((c) => [String(c._id), c]));
  res.json({
    ...concept,
    directPrerequisites: pre.map((d) => byId.get(String(d.prerequisiteId))),
    unlocks: dep.map((d) => byId.get(String(d.conceptId))),
  });
});

// All prerequisites of a concept in a valid learning order.
const getPrerequisites = asyncHandler(async (req, res) => {
  const result = await graphService.getPrerequisites(req.params.id);
  if (!result) throw new HttpError(404, 'Concept not found');
  res.json({
    concept: result.concept.name,
    conceptId: result.concept._id,
    directPrerequisites: result.direct.map((c) => c.name),
    prerequisites: result.prerequisites,
    count: result.prerequisites.length,
  });
});

// Dependency graph of a concept: the concept plus everything it needs.
const getConceptGraph = asyncHandler(async (req, res) => {
  const concept = await Concept.findById(req.params.id).lean();
  if (!concept) throw new HttpError(404, 'Concept not found');
  const { graph } = await graphService.buildGraph(concept.subjectId);
  const ids = [...graphService.findPrerequisites(graph, concept._id), String(concept._id)];
  const view = await graphService.buildGraphView(concept.subjectId, req.user, ids);
  res.json({ target: String(concept._id), ...view });
});

const getConceptQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ conceptId: req.params.id }).lean();
  if (!quiz) throw new HttpError(404, 'No quiz exists for this concept yet');
  res.json(sanitizeQuiz(quiz));
});

// ---- admin ----
const createConcept = asyncHandler(async (req, res) => {
  if (!(await Subject.findById(req.body.subjectId).lean())) throw new HttpError(404, 'Subject not found');
  const concept = await Concept.create(req.body);
  res.status(201).json(concept);
});

const createDependency = asyncHandler(async (req, res) => {
  const out = await graphService.addDependency(req.body.prerequisiteId, req.body.conceptId);
  if (out.error) throw new HttpError(out.status, out.error);
  res.status(201).json(out.dependency);
});

const deleteDependency = asyncHandler(async (req, res) => {
  const dep = await Dependency.findByIdAndDelete(req.params.id);
  if (!dep) throw new HttpError(404, 'Dependency not found');
  res.json({ message: 'Dependency removed' });
});

module.exports = {
  getConcept, getPrerequisites, getConceptGraph, getConceptQuiz,
  createConcept, createDependency, deleteDependency,
  conceptSchema, dependencySchema,
};
