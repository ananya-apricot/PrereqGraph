const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: [(v) => v.length >= 2, 'A question needs at least 2 options'],
  },
  correctAnswer: { type: Number, required: true, min: 0 }, // index into options
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  explanation: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema({
  conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true, unique: true },
  questions: [questionSchema],
});

module.exports = mongoose.model('Quiz', quizSchema);
