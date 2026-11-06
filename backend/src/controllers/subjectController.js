const { z } = require('zod');
const Subject = require('../models/Subject');
const Concept = require('../models/Concept');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const graphService = require('../services/graphService');

const subjectSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1).max(12),
  description: z.string().optional(),
  university: z.string().optional(),
});

const listSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().lean();
  const counts = await Promise.all(subjects.map((s) => Concept.countDocuments({ subjectId: s._id })));
  res.json(subjects.map((s, i) => ({ ...s, conceptCount: counts[i] })));
});

const getSubjectConcepts = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).lean();
  if (!subject) throw new HttpError(404, 'Subject not found');
  const concepts = await Concept.find({ subjectId: subject._id }).lean();
  concepts.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ subject, concepts });
});

// Whole-subject graph with the student's status on each node.
const getSubjectGraph = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).lean();
  if (!subject) throw new HttpError(404, 'Subject not found');
  const view = await graphService.buildGraphView(subject._id, req.user);
  res.json({ subject, ...view });
});

const createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json(subject);
});

module.exports = { listSubjects, getSubjectConcepts, getSubjectGraph, createSubject, subjectSchema };
