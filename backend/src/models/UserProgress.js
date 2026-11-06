const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true },
  masteryScore: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['unassessed', 'weak', 'mastered'], default: 'unassessed' },
  lastAssessedAt: { type: Date },
  completed: { type: Boolean, default: false },
});

// One current progress record per student per concept.
progressSchema.index({ userId: 1, conceptId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', progressSchema);
