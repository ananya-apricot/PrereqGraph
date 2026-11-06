const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // bcrypt hash, never plain text
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  // Per-student mastery threshold (0-100). A concept counts as mastered at or above it.
  masteryThreshold: { type: Number, default: 70, min: 1, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
