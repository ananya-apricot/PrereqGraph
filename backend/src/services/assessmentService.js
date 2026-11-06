const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const UserProgress = require('../models/UserProgress');

const WEIGHTS = { easy: 1, medium: 2, hard: 3 };
const DEFAULT_THRESHOLD = 70;

/** Status of a mastery score against a threshold (a score only exists once assessed). */
function statusFor(score, threshold = DEFAULT_THRESHOLD) {
  return score >= threshold ? 'mastered' : 'weak';
}

/**
 * Score a quiz (pure function).
 * answers: [{ questionId, selected }]  (selected = option index)
 * Unanswered questions count as wrong. Harder questions are worth more.
 */
function scoreQuiz(quiz, answers) {
  const given = new Map(answers.map((a) => [String(a.questionId), a.selected]));
  let earned = 0;
  let possible = 0;
  let correct = 0;
  const results = quiz.questions.map((q) => {
    const w = WEIGHTS[q.difficulty] || 1;
    const selected = given.has(String(q._id)) ? given.get(String(q._id)) : null;
    const isCorrect = selected === q.correctAnswer;
    possible += w;
    if (isCorrect) {
      earned += w;
      correct++;
    }
    return {
      questionId: q._id,
      question: q.question,
      selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    };
  });
  const score = possible === 0 ? 0 : Math.round((earned / possible) * 100);
  return { score, correct, total: quiz.questions.length, results };
}

/** Quiz without the answers, safe to send to a student. */
function sanitizeQuiz(quiz) {
  return {
    _id: quiz._id,
    conceptId: quiz.conceptId,
    questions: quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    })),
  };
}

/** Score a submission, store the attempt, and update the student's progress record. */
async function submitQuiz(user, quizId, answers) {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) return null;
  const result = scoreQuiz(quiz, answers);
  const threshold = user.masteryThreshold || DEFAULT_THRESHOLD;
  const status = statusFor(result.score, threshold);

  await Attempt.create({
    userId: user._id,
    conceptId: quiz.conceptId,
    quizId: quiz._id,
    score: result.score,
    correct: result.correct,
    total: result.total,
  });
  const progress = await UserProgress.findOneAndUpdate(
    { userId: user._id, conceptId: quiz.conceptId },
    {
      $set: {
        masteryScore: result.score,
        status,
        lastAssessedAt: new Date(),
        completed: status === 'mastered',
      },
    },
    { returnDocument: 'after', upsert: true }
  ).lean();
  return { ...result, status, threshold, progress };
}

module.exports = { scoreQuiz, sanitizeQuiz, statusFor, submitQuiz, DEFAULT_THRESHOLD };
