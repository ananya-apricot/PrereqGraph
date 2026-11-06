const { z } = require('zod');
const Quiz = require('../models/Quiz');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sanitizeQuiz, submitQuiz } = require('../services/assessmentService');

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selected: z.number().int().min(0),
  })).min(1, 'Submit at least one answer'),
});

const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  res.json(sanitizeQuiz(quiz));
});

const submit = asyncHandler(async (req, res) => {
  const out = await submitQuiz(req.user, req.params.id, req.body.answers);
  if (!out) throw new HttpError(404, 'Quiz not found');
  res.json(out);
});

module.exports = { getQuiz, submit, submitSchema };
