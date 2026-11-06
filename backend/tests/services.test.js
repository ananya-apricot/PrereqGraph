const { scoreQuiz, sanitizeQuiz, statusFor } = require('../src/services/assessmentService');
const { annotatePath, recommendNext, statusOf } = require('../src/services/recommendationService');
const { buildAdjacency, topologicalSort } = require('../src/services/graphService');
const { buildQuestion, mulberry32 } = require('../src/seed/seed');

const quiz = {
  _id: 'q1',
  conceptId: 'c1',
  questions: [
    { _id: 'a', question: 'A?', options: ['x', 'y'], correctAnswer: 1, difficulty: 'easy' },
    { _id: 'b', question: 'B?', options: ['x', 'y'], correctAnswer: 0, difficulty: 'medium' },
    { _id: 'c', question: 'C?', options: ['x', 'y'], correctAnswer: 0, difficulty: 'hard' },
  ],
};

describe('scoreQuiz', () => {
  test('perfect score', () => {
    const r = scoreQuiz(quiz, [{ questionId: 'a', selected: 1 }, { questionId: 'b', selected: 0 }, { questionId: 'c', selected: 0 }]);
    expect(r).toMatchObject({ score: 100, correct: 3, total: 3 });
  });
  test('harder questions weigh more (easy=1, medium=2, hard=3)', () => {
    const r = scoreQuiz(quiz, [{ questionId: 'a', selected: 1 }]); // only the easy one: 1/6
    expect(r.score).toBe(17);
    const r2 = scoreQuiz(quiz, [{ questionId: 'c', selected: 0 }]); // only the hard one: 3/6
    expect(r2.score).toBe(50);
  });
  test('unanswered and wrong answers score zero', () => {
    expect(scoreQuiz(quiz, [{ questionId: 'a', selected: 0 }]).score).toBe(0);
  });
  test('unknown question ids are ignored', () => {
    expect(scoreQuiz(quiz, [{ questionId: 'zzz', selected: 1 }]).score).toBe(0);
  });
  test('sanitizeQuiz hides the correct answers', () => {
    const s = sanitizeQuiz(quiz);
    expect(JSON.stringify(s)).not.toMatch(/correctAnswer/);
  });
  test('statusFor respects the threshold', () => {
    expect(statusFor(70, 70)).toBe('mastered');
    expect(statusFor(69, 70)).toBe('weak');
    expect(statusFor(69, 60)).toBe('mastered');
  });
});

describe('seed question builder', () => {
  test('shuffle is deterministic and the correct index points at the right answer', () => {
    const q = ['Q', 'RIGHT', 'w1', 'w2', 'w3', 'easy'];
    const a = buildQuestion(q, mulberry32(1));
    const b = buildQuestion(q, mulberry32(1));
    expect(a).toEqual(b);
    expect(a.options[a.correctAnswer]).toBe('RIGHT');
  });
});

// V -> F -> R -> DP, A -> DP
const concepts = ['V', 'F', 'R', 'A', 'DP'].map((n) => ({ _id: n, name: n, difficulty: 'beginner', estimatedHours: 2 }));
const graph = buildAdjacency(['V', 'F', 'R', 'A', 'DP'], [
  { prerequisiteId: 'V', conceptId: 'F' }, { prerequisiteId: 'F', conceptId: 'R' },
  { prerequisiteId: 'R', conceptId: 'DP' }, { prerequisiteId: 'A', conceptId: 'DP' },
]);
const byId = new Map(concepts.map((c) => [c._id, c]));
const prog = (obj) => new Map(Object.entries(obj).map(([id, s]) => [id, { masteryScore: s, status: s >= 70 ? 'mastered' : 'weak', completed: false }]));

describe('annotatePath', () => {
  const order = ['V', 'F', 'A', 'R', 'DP'].map((id) => byId.get(id));
  test('nothing assessed: quizzes recommended and target locked', () => {
    const { learningPath, summary } = annotatePath(order, 'DP', new Map());
    expect(learningPath.slice(0, 4).every((s) => s.action === 'take_quiz')).toBe(true);
    const target = learningPath[4];
    expect(target).toMatchObject({ status: 'locked', action: 'wait', isTarget: true });
    expect(summary.unmetPrerequisites).toBe(4);
  });
  test('weak prerequisites get revise, mastered ones are skipped', () => {
    const { learningPath } = annotatePath(order, 'DP', prog({ V: 90, F: 80, A: 40, R: 30 }));
    const by = Object.fromEntries(learningPath.map((s) => [s.concept, s.action]));
    expect(by).toMatchObject({ V: 'skip', F: 'skip', A: 'revise', R: 'revise', DP: 'wait' });
  });
  test('target unlocks once every prerequisite is mastered', () => {
    const { learningPath, summary } = annotatePath(order, 'DP', prog({ V: 90, F: 80, A: 75, R: 70 }));
    expect(learningPath[4]).toMatchObject({ status: 'ready', action: 'study' });
    expect(summary.unmetPrerequisites).toBe(0);
  });
  test('mastery threshold is configurable', () => {
    const p = prog({ V: 55, F: 55, A: 55, R: 55 });
    expect(annotatePath(order, 'DP', p, 70).learningPath[4].status).toBe('locked');
    expect(annotatePath(order, 'DP', p, 50).learningPath[4].status).toBe('ready');
  });
  test('completed flag counts as mastered', () => {
    const p = new Map([['A', { masteryScore: 10, status: 'weak', completed: true }]]);
    expect(statusOf(p.get('A'), 70)).toBe('mastered');
  });
  test('remaining hours ignore skipped concepts', () => {
    const { summary } = annotatePath(order, 'DP', prog({ V: 90, F: 80, A: 75, R: 70 }));
    expect(summary.remainingHours).toBe(2); // only DP is left
  });
});

describe('recommendNext', () => {
  const ordered = topologicalSort(graph);
  test('with no progress only root concepts are offered', () => {
    const next = recommendNext(graph, ordered, byId, new Map()).map((n) => n.concept).sort();
    expect(next).toEqual(['A', 'V']);
  });
  test('mastering V opens F', () => {
    const next = recommendNext(graph, ordered, byId, prog({ V: 90 })).map((n) => n.concept).sort();
    expect(next).toEqual(['A', 'F']);
  });
  test('weak concepts are recommended for revision', () => {
    const next = recommendNext(graph, ordered, byId, prog({ V: 30 }));
    expect(next.find((n) => n.concept === 'V').action).toBe('revise');
  });
});
