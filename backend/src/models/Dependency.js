const mongoose = require('mongoose');

// Directed edge: prerequisiteId -> conceptId ("prerequisite must be learned before concept").
// Stored separately from concepts so one concept can have many prerequisites
// and one prerequisite can unlock many concepts.
const dependencySchema = new mongoose.Schema({
  prerequisiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true, index: true },
  conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true, index: true },
});

dependencySchema.index({ prerequisiteId: 1, conceptId: 1 }, { unique: true });

module.exports = mongoose.model('Dependency', dependencySchema);
