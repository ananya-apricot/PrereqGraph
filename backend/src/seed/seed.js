// Usage: npm run seed
// Wipes the curriculum collections, inserts the DSA subject, concepts, dependencies and quizzes,
// and creates a demo admin account. Existing student accounts are kept.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Subject = require('../models/Subject');
const Concept = require('../models/Concept');
const Dependency = require('../models/Dependency');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Attempt = require('../models/Attempt');
const graphService = require('../services/graphService');
const data = require('./dsaData');

// Small deterministic PRNG so the shuffled quiz options are the same on every run.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildQuestion([question, right, w1, w2, w3, difficulty], rand) {
  const options = [right, w1, w2, w3];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { question, options, correctAnswer: options.indexOf(right), difficulty };
}

async function seedCurriculum() {
  await Promise.all([Subject, Concept, Dependency, Quiz, UserProgress, Attempt].map((m) => m.deleteMany({})));
  const subject = await Subject.create(data.subject);
  const idByKey = {};
  for (const [key, name, difficulty, estimatedHours, description] of data.concepts) {
    const c = await Concept.create({ subjectId: subject._id, name, difficulty, estimatedHours, description });
    idByKey[key] = c._id;
  }
  const edges = [];
  for (const [key, , , , , prereqs] of data.concepts) {
    for (const p of prereqs) edges.push({ prerequisiteId: idByKey[p], conceptId: idByKey[key] });
  }
  // Safety net: never store a cyclic curriculum.
  const cycle = graphService.detectCycle(graphService.buildAdjacency(Object.values(idByKey), edges));
  if (cycle) throw new Error('Seed data contains a cycle');
  await Dependency.insertMany(edges);
  const rand = mulberry32(2026);
  await Quiz.insertMany(
    data.concepts.map(([key, , , , , , qs]) => ({ conceptId: idByKey[key], questions: qs.map((q) => buildQuestion(q, rand)) }))
  );
  return { subject, concepts: Object.keys(idByKey).length, dependencies: edges.length, idByKey };
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@prereqgraph.dev';
  const password = process.env.ADMIN_PASSWORD || 'admin1234';
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Admin', email, password: await bcrypt.hash(password, 10), role: 'admin' });
  }
  return { email, password };
}

module.exports = { seedCurriculum, seedAdmin, buildQuestion, mulberry32 };

if (require.main === module) {
  (async () => {
    await connectDB();
    const out = await seedCurriculum();
    const admin = await seedAdmin();
    console.log(`Seeded "${out.subject.name}": ${out.concepts} concepts, ${out.dependencies} dependencies, quizzes for every concept.`);
    console.log(`Demo admin: ${admin.email} / ${admin.password} (change this outside local development)`);
    await mongoose.disconnect();
  })().catch((e) => { console.error(e); process.exit(1); });
}
