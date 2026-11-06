// Graph engine. The pure functions (buildAdjacency, DFS/BFS, cycle detection,
// topological sort) work on plain data so they are easy to unit test.
// The DB-backed functions at the bottom load data and call the pure ones.
const Concept = require('../models/Concept');
const Dependency = require('../models/Dependency');

const str = (id) => String(id);

/**
 * Build an adjacency structure from concept ids and dependency edges.
 *   dependents[p]    -> concepts that require p   (the "graph" in the spec)
 *   prerequisites[c] -> concepts c requires       (reverse direction)
 * edges: [{ prerequisiteId, conceptId }]
 */
function buildAdjacency(conceptIds, edges) {
  const dependents = {};
  const prerequisites = {};
  const nodes = conceptIds.map(str);
  for (const id of nodes) {
    dependents[id] = [];
    prerequisites[id] = [];
  }
  for (const e of edges) {
    const p = str(e.prerequisiteId);
    const c = str(e.conceptId);
    // ignore edges that point outside the node set (e.g. other subjects)
    if (!(p in dependents) || !(c in dependents)) continue;
    if (!dependents[p].includes(c)) dependents[p].push(c);
    if (!prerequisites[c].includes(p)) prerequisites[c].push(p);
  }
  return { nodes, dependents, prerequisites };
}

/**
 * DFS backwards from the target: every concept that must be learned first
 * (direct and indirect prerequisites). Iterative, so deep graphs cannot overflow the stack.
 * Returns an array of ids, target excluded.
 */
function findPrerequisites(graph, targetId) {
  const target = str(targetId);
  if (!(target in graph.prerequisites)) return [];
  const seen = new Set();
  const stack = [...graph.prerequisites[target]];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const p of graph.prerequisites[id]) if (!seen.has(p)) stack.push(p);
  }
  seen.delete(target); // only possible if the graph had a cycle
  return [...seen];
}

/** BFS forwards: every concept unlocked (directly or indirectly) by `startId`, with distance. */
function findDependents(graph, startId) {
  const start = str(startId);
  if (!(start in graph.dependents)) return [];
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const id = queue.shift();
    for (const next of graph.dependents[id]) {
      if (!dist.has(next)) {
        dist.set(next, dist.get(id) + 1);
        queue.push(next);
      }
    }
  }
  dist.delete(start);
  return [...dist].map(([id, distance]) => ({ id, distance }));
}

/**
 * Cycle detection with three-colour DFS.
 * Returns null for a DAG, otherwise one cycle as an array of ids ([a, b, c, a]).
 */
function detectCycle(graph) {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = {};
  for (const id of graph.nodes) color[id] = WHITE;

  for (const root of graph.nodes) {
    if (color[root] !== WHITE) continue;
    const path = [root];
    const iters = [0];
    color[root] = GREY;
    while (path.length) {
      const node = path[path.length - 1];
      const i = iters[iters.length - 1];
      const nexts = graph.dependents[node];
      if (i < nexts.length) {
        iters[iters.length - 1]++;
        const nxt = nexts[i];
        if (color[nxt] === GREY) return [...path.slice(path.indexOf(nxt)), nxt];
        if (color[nxt] === WHITE) {
          color[nxt] = GREY;
          path.push(nxt);
          iters.push(0);
        }
      } else {
        color[node] = BLACK;
        path.pop();
        iters.pop();
      }
    }
  }
  return null;
}

/**
 * Would adding prerequisiteId -> conceptId create a cycle?
 * Yes if they are the same node, or if prerequisiteId is already reachable from conceptId.
 */
function wouldCreateCycle(graph, prerequisiteId, conceptId) {
  const p = str(prerequisiteId);
  const c = str(conceptId);
  if (p === c) return true;
  return findDependents(graph, c).some((d) => d.id === p);
}

/**
 * Kahn's algorithm. Prerequisites always come before the concepts that need them.
 * `subset` (optional array of ids) restricts the sort to those nodes.
 * `compare` breaks ties between concepts that are ready at the same time
 * (default: id order, so the output is deterministic). Throws if a cycle exists.
 */
function topologicalSort(graph, subset, compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
  const nodes = subset ? subset.map(str) : graph.nodes;
  const inSet = new Set(nodes);
  const indegree = {};
  for (const id of nodes) {
    indegree[id] = graph.prerequisites[id].filter((p) => inSet.has(p)).length;
  }
  const ready = nodes.filter((id) => indegree[id] === 0).sort(compare);
  const order = [];
  while (ready.length) {
    const id = ready.shift();
    order.push(id);
    for (const d of graph.dependents[id]) {
      if (!inSet.has(d)) continue;
      indegree[d]--;
      if (indegree[d] === 0) {
        ready.push(d);
        ready.sort(compare);
      }
    }
  }
  if (order.length !== nodes.length) throw new Error('Cycle detected: topological order is impossible');
  return order;
}

/** Longest distance from any root, used by the UI to lay the graph out in layers. */
function computeLevels(graph) {
  const levels = {};
  for (const id of topologicalSort(graph)) {
    levels[id] = graph.prerequisites[id].reduce((m, p) => Math.max(m, levels[p] + 1), 0);
  }
  return levels;
}

// ---------------------------------------------------------------- DB-backed

/** Load the whole dependency graph of a subject. */
async function buildGraph(subjectId) {
  const concepts = await Concept.find({ subjectId }).lean();
  const ids = concepts.map((c) => c._id);
  const edges = await Dependency.find({ conceptId: { $in: ids } }).lean();
  return { graph: buildAdjacency(ids, edges), concepts, edges };
}

/** All prerequisites of a concept, in a valid learning order. */
async function getPrerequisites(conceptId) {
  const concept = await Concept.findById(conceptId).lean();
  if (!concept) return null;
  const { graph, concepts } = await buildGraph(concept.subjectId);
  const byId = new Map(concepts.map((c) => [str(c._id), c]));
  const prereqIds = findPrerequisites(graph, conceptId);
  const order = topologicalSort(graph, prereqIds, (a, b) => byId.get(a).name.localeCompare(byId.get(b).name));
  return {
    concept,
    direct: graph.prerequisites[str(conceptId)].map((id) => byId.get(id)),
    prerequisites: order.map((id) => byId.get(id)),
  };
}

/**
 * Validate and create a dependency. Used by the admin endpoint so a cycle can
 * never be written to the database.
 */
async function addDependency(prerequisiteId, conceptId) {
  const [pre, con] = await Promise.all([Concept.findById(prerequisiteId).lean(), Concept.findById(conceptId).lean()]);
  if (!pre || !con) return { error: 'Both concepts must exist', status: 404 };
  if (str(pre.subjectId) !== str(con.subjectId)) return { error: 'Concepts must belong to the same subject', status: 400 };
  if (str(prerequisiteId) === str(conceptId)) return { error: 'A concept cannot be its own prerequisite', status: 400 };
  const { graph } = await buildGraph(con.subjectId);
  if (graph.dependents[str(prerequisiteId)].includes(str(conceptId))) {
    return { error: 'Dependency already exists', status: 409 };
  }
  if (wouldCreateCycle(graph, prerequisiteId, conceptId)) {
    return { error: `Adding "${pre.name}" -> "${con.name}" would create a cycle`, status: 400 };
  }
  const dependency = await Dependency.create({ prerequisiteId, conceptId });
  return { dependency };
}

/**
 * Graph for the UI: nodes (with layer + the student's status) and edges.
 * `onlyIds` restricts the view to a subset (e.g. a target and its prerequisites).
 */
async function buildGraphView(subjectId, user, onlyIds) {
  const { loadProgressMap, statusOf } = require('./recommendationService');
  const { graph, concepts, edges } = await buildGraph(subjectId);
  const levels = computeLevels(graph);
  const progress = await loadProgressMap(user._id);
  const threshold = user.masteryThreshold || 70;
  const keep = onlyIds ? new Set(onlyIds.map(str)) : null;
  const nodes = concepts
    .filter((c) => !keep || keep.has(str(c._id)))
    .map((c) => {
      const p = progress.get(str(c._id));
      return {
        id: str(c._id),
        name: c.name,
        description: c.description,
        difficulty: c.difficulty,
        estimatedHours: c.estimatedHours,
        level: levels[str(c._id)],
        status: statusOf(p, threshold),
        masteryScore: p ? p.masteryScore : null,
      };
    });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const viewEdges = edges
    .filter((e) => nodeIds.has(str(e.prerequisiteId)) && nodeIds.has(str(e.conceptId)))
    .map((e) => ({ id: str(e._id), source: str(e.prerequisiteId), target: str(e.conceptId) }));
  return { nodes, edges: viewEdges, threshold };
}

/**
 * Personalised learning path to a target concept:
 * graph (DFS prerequisites + topological order) combined with the student's progress.
 */
async function generateLearningPath(targetId, user) {
  const { loadProgressMap, annotatePath } = require('./recommendationService');
  const target = await Concept.findById(targetId).lean();
  if (!target) return null;
  const { graph, concepts } = await buildGraph(target.subjectId);
  const byId = new Map(concepts.map((c) => [str(c._id), c]));
  const ids = [...findPrerequisites(graph, targetId), str(targetId)];
  const order = topologicalSort(graph, ids, (a, b) => byId.get(a).name.localeCompare(byId.get(b).name));
  const progress = await loadProgressMap(user._id);
  const threshold = user.masteryThreshold || 70;
  const { learningPath, summary } = annotatePath(order.map((id) => byId.get(id)), targetId, progress, threshold);
  return { target: target.name, targetId: target._id, threshold, learningPath, summary };
}

module.exports = {
  buildGraphView,
  generateLearningPath,
  buildAdjacency,
  findPrerequisites,
  findDependents,
  detectCycle,
  wouldCreateCycle,
  topologicalSort,
  computeLevels,
  buildGraph,
  getPrerequisites,
  addDependency,
};
