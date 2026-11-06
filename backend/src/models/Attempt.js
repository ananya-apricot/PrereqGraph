const mongoose = require('mongoose');

// Full history of quiz attempts (UserProgress only keeps the current state).
const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Attempt', attemptSchema);
