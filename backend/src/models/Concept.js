const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedHours: { type: Number, default: 1, min: 0 },
});

conceptSchema.index({ subjectId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Concept', conceptSchema);
