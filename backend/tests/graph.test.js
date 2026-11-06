const g = require('../src/services/graphService');
const { concepts, subject } = require('../src/seed/dsaData');

const edge = (a, b) => ({ prerequisiteId: a, conceptId: b });
const build = (ids, edges) => g.buildAdjacency(ids, edges.map(([a, b]) => edge(a, b)));

// Spec example: Variables -> Functions -> Recursion -> DP, Arrays -> DP
const spec = build(['V', 'F', 'R', 'A', 'DP'], [['V', 'F'], ['F', 'R'], ['R', 'DP'], ['A', 'DP']]);

describe('findPrerequisites (DFS)', () => {
  test('returns all four prerequisites of Dynamic Programming', () => {
    expect(g.findPrerequisites(spec, 'DP').sort()).toEqual(['A', 'F', 'R', 'V']);
  });
  test('root concept has no prerequisites', () => {
    expect(g.findPrerequisites(spec, 'V')).toEqual([]);
    expect(g.findPrerequisites(spec, 'A')).toEqual([]);
  });
  test('unknown id gives an empty list', () => {
    expect(g.findPrerequisites(spec, 'nope')).toEqual([]);
  });
  test('diamond: shared prerequisite is reported once', () => {
    const d = build(['a', 'b', 'c', 'd'], [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd']]);
    expect(g.findPrerequisites(d, 'd').sort()).toEqual(['a', 'b', 'c']);
  });
  test('very long chain does not overflow the stack', () => {
    const n = 20000;
    const ids = Array.from({ length: n }, (_, i) => `n${i}`);
    const long = build(ids, ids.slice(1).map((id, i) => [ids[i], id]));
    expect(g.findPrerequisites(long, `n${n - 1}`)).toHaveLength(n - 1);
  });
});

describe('findDependents (BFS)', () => {
  test('lists everything unlocked with distances', () => {
    const out = g.findDependents(spec, 'V');
    expect(Object.fromEntries(out.map((d) => [d.id, d.distance]))).toEqual({ F: 1, R: 2, DP: 3 });
  });
});

describe('detectCycle', () => {
  test('DAG returns null', () => expect(g.detectCycle(spec)).toBeNull());
  test('finds a simple cycle', () => {
    const c = g.detectCycle(build(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['c', 'a']]));
    expect(c[0]).toBe(c[c.length - 1]);
    expect(new Set(c)).toEqual(new Set(['a', 'b', 'c']));
  });
  test('finds a self loop', () => {
    expect(g.detectCycle(build(['a'], [['a', 'a']]))).toEqual(['a', 'a']);
  });
  test('finds a cycle in a disconnected component', () => {
    const c = g.detectCycle(build(['x', 'a', 'b'], [['a', 'b'], ['b', 'a']]));
    expect(c).not.toBeNull();
  });
  test('empty graph has no cycle', () => expect(g.detectCycle(build([], []))).toBeNull());
});

describe('wouldCreateCycle', () => {
  test('rejects an edge that closes a loop', () => expect(g.wouldCreateCycle(spec, 'DP', 'V')).toBe(true));
  test('rejects self dependency', () => expect(g.wouldCreateCycle(spec, 'A', 'A')).toBe(true));
  test('allows a harmless new edge', () => expect(g.wouldCreateCycle(spec, 'A', 'R')).toBe(false));
  test('allows a redundant forward edge', () => expect(g.wouldCreateCycle(spec, 'V', 'DP')).toBe(false));
});

describe('topologicalSort', () => {
  const pos = (order) => Object.fromEntries(order.map((id, i) => [id, i]));
  test('prerequisites come before dependents', () => {
    const p = pos(g.topologicalSort(spec));
    expect(p.V).toBeLessThan(p.F);
    expect(p.F).toBeLessThan(p.R);
    expect(p.R).toBeLessThan(p.DP);
    expect(p.A).toBeLessThan(p.DP);
  });
  test('sorting a subset only returns that subset', () => {
    expect(g.topologicalSort(spec, ['R', 'F', 'V'])).toEqual(['V', 'F', 'R']);
  });
  test('tie-break comparator controls the order of independent concepts', () => {
    const rev = g.topologicalSort(spec, ['A', 'V'], (a, b) => (a < b ? 1 : -1));
    expect(rev).toEqual(['V', 'A']);
  });
  test('throws on a cycle', () => {
    expect(() => g.topologicalSort(build(['a', 'b'], [['a', 'b'], ['b', 'a']]))).toThrow(/Cycle/);
  });
  test('levels are the longest distance from a root', () => {
    expect(g.computeLevels(spec)).toEqual({ V: 0, A: 0, F: 1, R: 2, DP: 3 });
  });
});

describe('DSA seed curriculum', () => {
  const keys = concepts.map((c) => c[0]);
  const edges = concepts.flatMap(([k, , , , , pre]) => pre.map((p) => [p, k]));
  test('has between 30 and 50 concepts with unique keys', () => {
    expect(concepts.length).toBeGreaterThanOrEqual(30);
    expect(concepts.length).toBeLessThanOrEqual(50);
    expect(new Set(keys).size).toBe(keys.length);
  });
  test('every prerequisite refers to an existing concept', () => {
    for (const [p] of edges) expect(keys).toContain(p);
  });
  test('curriculum is acyclic', () => expect(g.detectCycle(build(keys, edges))).toBeNull());
  test('Dynamic Programming needs exactly Variables, Functions, Recursion, Arrays', () => {
    const graph = build(keys, edges);
    expect(g.findPrerequisites(graph, 'dp').sort()).toEqual(['arrays', 'functions', 'recursion', 'variables']);
  });
  test('every concept has 3 well-formed questions', () => {
    for (const c of concepts) {
      expect(c[6]).toHaveLength(3);
      for (const q of c[6]) {
        expect(q).toHaveLength(6);
        expect(new Set(q.slice(1, 5)).size).toBe(4); // options are distinct
        expect(['easy', 'medium', 'hard']).toContain(q[5]);
      }
    }
  });
  test('subject metadata', () => expect(subject.code).toBe('DSA'));
});
