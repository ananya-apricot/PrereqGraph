// Integration tests: real Express app + real MongoDB-compatible database.
// Set MONGO_URI_TEST (default: mongodb://127.0.0.1:27017/prereqgraph_test). The database is wiped.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Concept = require('../src/models/Concept');
const Quiz = require('../src/models/Quiz');
const { seedCurriculum } = require('../src/seed/seed');

let seed, adminToken, token, byName;
const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

// Answer a concept's quiz correctly (right=true) or deliberately wrong.
async function takeQuiz(conceptId, right, t = token) {
  const quiz = await Quiz.findOne({ conceptId }).lean();
  const answers = quiz.questions.map((q) => ({
    questionId: String(q._id),
    selected: right ? q.correctAnswer : (q.correctAnswer + 1) % q.options.length,
  }));
  return request(app).post(`/api/quizzes/${quiz._id}/submit`).set(auth(t)).send({ answers });
}

beforeAll(async () => {
  await connectDB(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/prereqgraph_test');
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init()));
  seed = await seedCurriculum();
  const concepts = await Concept.find().lean();
  byName = Object.fromEntries(concepts.map((c) => [c.name, c]));
  await User.create({ name: 'Admin', email: 'admin@test.dev', password: await bcrypt.hash('adminpass', 10), role: 'admin' });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.dev', password: 'adminpass' })).body.token;
  const reg = await request(app).post('/api/auth/register').send({ name: 'Stu', email: 'Stu@Test.dev', password: 'secret12' });
  token = reg.body.token;
});
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

describe('auth', () => {
  test('register returns a token and never exposes the password', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'B', email: 'b@test.dev', password: 'secret12' });
    expect(r.status).toBe(201);
    expect(r.body.token).toBeTruthy();
    expect(JSON.stringify(r.body)).not.toMatch(/password/);
  });
  test('password is stored hashed', async () => {
    const u = await User.findOne({ email: 'stu@test.dev' }).lean();
    expect(u.password).not.toBe('secret12');
    expect(u.password).toMatch(/^\$2[aby]\$/);
  });
  test('duplicate email (case-insensitive) is rejected', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'X', email: 'STU@test.dev', password: 'secret12' });
    expect(r.status).toBe(409);
  });
  test('sign-up cannot choose the admin role', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'Evil', email: 'evil@test.dev', password: 'secret12', role: 'admin' });
    expect(r.body.user.role).toBe('student');
  });
  test('validation errors give 400', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: '', email: 'bad', password: '1' })).status).toBe(400);
  });
  test('login works, wrong password gives 401', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'stu@test.dev', password: 'secret12' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'stu@test.dev', password: 'nope' })).status).toBe(401);
  });
  test('protected routes need a valid token', async () => {
    expect((await request(app).get('/api/subjects')).status).toBe(401);
    expect((await request(app).get('/api/subjects').set(auth('garbage'))).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth())).body.user.email).toBe('stu@test.dev');
  });
  test('student can change their mastery threshold', async () => {
    const r = await request(app).patch('/api/auth/me').set(auth()).send({ masteryThreshold: 60 });
    expect(r.body.user.masteryThreshold).toBe(60);
    await request(app).patch('/api/auth/me').set(auth()).send({ masteryThreshold: 70 });
    expect((await request(app).patch('/api/auth/me').set(auth()).send({ masteryThreshold: 500 })).status).toBe(400);
  });
});

describe('subjects and concepts', () => {
  test('lists the DSA subject with its concept count', async () => {
    const r = await request(app).get('/api/subjects').set(auth());
    expect(r.body[0]).toMatchObject({ code: 'DSA', conceptCount: 31 });
  });
  test('lists concepts of a subject', async () => {
    const r = await request(app).get(`/api/subjects/${seed.subject._id}/concepts`).set(auth());
    expect(r.body.concepts).toHaveLength(31);
  });
  test('prerequisites of Dynamic Programming: all four, in a valid order', async () => {
    const r = await request(app).get(`/api/concepts/${byName['Dynamic Programming']._id}/prerequisites`).set(auth());
    expect(r.status).toBe(200);
    const names = r.body.prerequisites.map((c) => c.name);
    expect(names.sort()).toEqual(['Arrays', 'Functions', 'Recursion', 'Variables and Data Types']);
    const ordered = r.body.prerequisites.map((c) => c.name);
    expect(ordered.indexOf('Variables and Data Types')).toBeLessThan(ordered.indexOf('Functions'));
    expect(ordered.indexOf('Functions')).toBeLessThan(ordered.indexOf('Recursion'));
    expect(r.body.directPrerequisites.sort()).toEqual(['Arrays', 'Recursion']);
  });
  test('root concept has no prerequisites', async () => {
    const r = await request(app).get(`/api/concepts/${byName['Arrays']._id}/prerequisites`).set(auth());
    expect(r.body.prerequisites).toEqual([]);
  });
  test('concept graph contains the target and its ancestors only', async () => {
    const r = await request(app).get(`/api/concepts/${byName['Dynamic Programming']._id}/graph`).set(auth());
    expect(r.body.nodes).toHaveLength(5);
    expect(r.body.edges).toHaveLength(4);
    expect(r.body.nodes.every((n) => n.status === 'unassessed')).toBe(true);
  });
  test('subject graph returns every node and edge', async () => {
    const r = await request(app).get(`/api/subjects/${seed.subject._id}/graph`).set(auth());
    expect(r.body.nodes).toHaveLength(31);
    expect(r.body.edges).toHaveLength(51);
  });
  test('malformed and unknown ids', async () => {
    expect((await request(app).get('/api/concepts/not-an-id').set(auth())).status).toBe(400);
    expect((await request(app).get(`/api/concepts/${new mongoose.Types.ObjectId()}/prerequisites`).set(auth())).status).toBe(404);
  });
});

describe('admin curriculum management', () => {
  const dep = (p, c, t = adminToken) =>
    request(app).post('/api/dependencies').set(auth(t)).send({ prerequisiteId: String(byName[p]._id), conceptId: String(byName[c]._id) });
  test('students cannot create dependencies', async () => {
    expect((await dep('Arrays', 'Strings', token)).status).toBe(403);
  });
  test('a dependency that would create a cycle is rejected', async () => {
    const r = await dep('Dynamic Programming', 'Variables and Data Types');
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/cycle/i);
  });
  test('self dependency and duplicates are rejected', async () => {
    expect((await dep('Arrays', 'Arrays')).status).toBe(400);
    expect((await dep('Arrays', 'Strings')).status).toBe(409);
  });
  test('a valid dependency is created and then removable', async () => {
    const r = await dep('Arrays', 'Recursion');
    expect(r.status).toBe(201);
    const del = await request(app).delete(`/api/dependencies/${r.body._id}`).set(auth(adminToken));
    expect(del.status).toBe(200);
  });
  test('admin can add a subject, concept and link it', async () => {
    const s = await request(app).post('/api/subjects').set(auth(adminToken)).send({ name: 'Algebra', code: 'alg' });
    expect(s.status).toBe(201);
    expect(s.body.code).toBe('ALG');
    const c = await request(app).post('/api/concepts').set(auth(adminToken)).send({ subjectId: s.body._id, name: 'Sets' });
    expect(c.status).toBe(201);
    expect((await request(app).post('/api/concepts').set(auth()).send({ subjectId: s.body._id, name: 'X' })).status).toBe(403);
  });
  test('cross-subject dependencies are rejected', async () => {
    const algebraConcept = await Concept.findOne({ name: 'Sets' }).lean();
    const r = await request(app).post('/api/dependencies').set(auth(adminToken))
      .send({ prerequisiteId: String(algebraConcept._id), conceptId: String(byName['Arrays']._id) });
    expect(r.status).toBe(400);
  });
});

describe('quizzes and progress', () => {
  test('quiz is served without answers', async () => {
    const r = await request(app).get(`/api/concepts/${byName['Arrays']._id}/quiz`).set(auth());
    expect(r.status).toBe(200);
    expect(r.body.questions).toHaveLength(3);
    expect(JSON.stringify(r.body)).not.toMatch(/correctAnswer/);
  });
  test('wrong answers mark the concept weak', async () => {
    const r = await takeQuiz(byName['Arrays']._id, false);
    expect(r.body).toMatchObject({ score: 0, status: 'weak' });
    const p = await request(app).get('/api/users/me/progress').set(auth());
    expect(p.body.find((x) => x.concept === 'Arrays')).toMatchObject({ status: 'weak', masteryScore: 0 });
  });
  test('retaking with correct answers masters it and keeps history', async () => {
    const r = await takeQuiz(byName['Arrays']._id, true);
    expect(r.body).toMatchObject({ score: 100, status: 'mastered' });
    expect(r.body.results.every((x) => x.isCorrect)).toBe(true);
    const a = await request(app).get('/api/users/me/attempts').set(auth());
    expect(a.body.filter((x) => x.concept === 'Arrays')).toHaveLength(2);
    // still exactly one progress record per concept
    const p = await request(app).get('/api/users/me/progress').set(auth());
    expect(p.body.filter((x) => x.concept === 'Arrays')).toHaveLength(1);
  });
  test('submit validates input', async () => {
    const quiz = await Quiz.findOne({ conceptId: byName['Arrays']._id }).lean();
    expect((await request(app).post(`/api/quizzes/${quiz._id}/submit`).set(auth()).send({ answers: [] })).status).toBe(400);
    expect((await request(app).post(`/api/quizzes/${new mongoose.Types.ObjectId()}/submit`).set(auth()).send({ answers: [{ questionId: 'x', selected: 0 }] })).status).toBe(404);
  });
});

describe('learning path', () => {
  const path = (name, t = token) => request(app).get(`/api/users/me/learning-path/${byName[name]._id}`).set(auth(t));
  test('is personalised: Arrays mastered, the rest need a quiz, target locked', async () => {
    const r = await path('Dynamic Programming');
    expect(r.status).toBe(200);
    expect(r.body.target).toBe('Dynamic Programming');
    const steps = Object.fromEntries(r.body.learningPath.map((s) => [s.concept, s]));
    expect(steps['Arrays'].action).toBe('skip');
    expect(steps['Recursion'].action).toBe('take_quiz');
    expect(steps['Dynamic Programming']).toMatchObject({ status: 'locked', isTarget: true });
    expect(r.body.learningPath[r.body.learningPath.length - 1].isTarget).toBe(true);
  });
  test('weak prerequisite is flagged for revision', async () => {
    await takeQuiz(byName['Variables and Data Types']._id, false);
    const r = await path('Dynamic Programming');
    expect(r.body.learningPath.find((s) => s.concept === 'Variables and Data Types').action).toBe('revise');
  });
  test('path recalculates as progress changes and finally unlocks the target', async () => {
    for (const n of ['Variables and Data Types', 'Functions', 'Recursion']) {
      expect((await takeQuiz(byName[n]._id, true)).body.status).toBe('mastered');
    }
    const r = await path('Dynamic Programming');
    expect(r.body.learningPath.at(-1)).toMatchObject({ status: 'ready', action: 'study' });
    expect(r.body.summary.unmetPrerequisites).toBe(0);
  });
  test('graph node statuses reflect progress', async () => {
    const r = await request(app).get(`/api/concepts/${byName['Dynamic Programming']._id}/graph`).set(auth());
    const st = Object.fromEntries(r.body.nodes.map((n) => [n.name, n.status]));
    expect(st).toMatchObject({ Arrays: 'mastered', Recursion: 'mastered', 'Dynamic Programming': 'unassessed' });
  });
  test('progress is per student', async () => {
    const other = (await request(app).post('/api/auth/register').send({ name: 'O', email: 'o@test.dev', password: 'secret12' })).body.token;
    const r = await path('Dynamic Programming', other);
    expect(r.body.learningPath.at(-1).status).toBe('locked');
  });
  test('404 for an unknown target', async () => {
    const r = await request(app).get(`/api/users/me/learning-path/${new mongoose.Types.ObjectId()}`).set(auth());
    expect(r.status).toBe(404);
  });
});

describe('manual progress updates and dashboard', () => {
  test('marking a concept complete masters it; un-completing makes it weak', async () => {
    const id = byName['Strings']._id;
    const done = await request(app).patch(`/api/users/me/progress/${id}`).set(auth()).send({ completed: true });
    expect(done.body).toMatchObject({ status: 'mastered', completed: true });
    const undone = await request(app).patch(`/api/users/me/progress/${id}`).set(auth()).send({ completed: false });
    expect(undone.body).toMatchObject({ status: 'weak', completed: false });
    expect(undone.body.masteryScore).toBeLessThan(70);
  });
  test('validation', async () => {
    const id = byName['Strings']._id;
    expect((await request(app).patch(`/api/users/me/progress/${id}`).set(auth()).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/users/me/progress/${id}`).set(auth()).send({ masteryScore: 101 })).status).toBe(400);
  });
  test('dashboard summarises progress and suggests next topics', async () => {
    const r = await request(app).get('/api/users/me/dashboard').set(auth());
    expect(r.status).toBe(200);
    const dsa = r.body.subjects.find((s) => s.subject.code === 'DSA');
    expect(dsa.total).toBe(31);
    expect(dsa.mastered).toBe(4);
    expect(dsa.mastered + dsa.weak + dsa.unassessed).toBe(31);
    expect(dsa.next.length).toBeGreaterThan(0);
    expect(r.body.weakConcepts.map((w) => w.concept)).toContain('Strings');
    expect(r.body.recentAttempts.length).toBeGreaterThan(0);
  });
  test('unknown routes return JSON 404', async () => {
    const r = await request(app).get('/api/nothing');
    expect(r.status).toBe(404);
    expect(r.body.message).toMatch(/not found/i);
  });
});
