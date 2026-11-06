// Turns graph results + a student's progress into recommendations.
// annotatePath / recommendNext are pure; loadProgressMap hits the database.
const UserProgress = require('../models/UserProgress');
const { DEFAULT_THRESHOLD } = require('./assessmentService');

/** Map of conceptId -> progress record for one student. */
async function loadProgressMap(userId) {
  const rows = await UserProgress.find({ userId }).lean();
  return new Map(rows.map((r) => [String(r.conceptId), r]));
}

/** Effective status of a concept for a student: mastered | weak | unassessed. */
function statusOf(progress, threshold) {
  if (!progress) return 'unassessed';
  if (progress.completed || progress.masteryScore >= threshold) return 'mastered';
  return progress.status === 'unassessed' ? 'unassessed' : 'weak';
}

/**
 * Personalise an ordered list of prerequisite concepts plus the target.
 *  orderedConcepts: concepts in topological order, target last
 *  Every step gets a status, an action and a reason.
 *  The target is "ready" once all its prerequisites are mastered, otherwise "locked".
 */
function annotatePath(orderedConcepts, targetId, progressMap, threshold = DEFAULT_THRESHOLD) {
  const target = String(targetId);
  const steps = orderedConcepts.map((c) => {
    const id = String(c._id);
    const p = progressMap.get(id);
    return { concept: c, status: statusOf(p, threshold), masteryScore: p ? p.masteryScore : null };
  });
  const prereqSteps = steps.filter((s) => String(s.concept._id) !== target);
  const blockers = prereqSteps.filter((s) => s.status !== 'mastered');
  const prereqNames = prereqSteps.map((s) => s.concept.name);

  const learningPath = steps.map((s) => {
    const isTarget = String(s.concept._id) === target;
    let status = s.status;
    let action;
    let reason;
    if (isTarget) {
      if (s.status === 'mastered') {
        status = 'mastered';
        action = 'done';
        reason = 'You have already mastered this concept.';
      } else if (blockers.length === 0) {
        status = 'ready';
        action = s.status === 'weak' ? 'revise' : 'study';
        reason = 'All prerequisites are mastered, so this concept is unlocked.';
      } else {
        status = 'locked';
        action = 'wait';
        reason = `Locked until ${blockers.length} prerequisite${blockers.length > 1 ? 's are' : ' is'} mastered.`;
      }
    } else if (s.status === 'mastered') {
      action = 'skip';
      reason = `Mastered (${s.masteryScore}%). Revise only if you want a refresher.`;
    } else if (s.status === 'weak') {
      action = 'revise';
      reason = `Score ${s.masteryScore}% is below your mastery threshold of ${threshold}%.`;
    } else {
      action = 'take_quiz';
      reason = 'Not assessed yet. Take the diagnostic quiz to see if you already know it.';
    }
    return {
      conceptId: s.concept._id,
      concept: s.concept.name,
      difficulty: s.concept.difficulty,
      estimatedHours: s.concept.estimatedHours,
      status,
      action,
      reason,
      masteryScore: s.masteryScore,
      isTarget,
    };
  });

  const remainingHours = learningPath
    .filter((s) => !['skip', 'done'].includes(s.action))
    .reduce((sum, s) => sum + (s.estimatedHours || 0), 0);

  return { learningPath, summary: { totalSteps: learningPath.length, prerequisiteCount: prereqNames.length, unmetPrerequisites: blockers.length, remainingHours } };
}

/**
 * "What should I study next?" - concepts that are not mastered yet whose
 * prerequisites are all mastered, in topological order.
 */
function recommendNext(graph, orderedIds, conceptsById, progressMap, threshold = DEFAULT_THRESHOLD, limit = 5) {
  const mastered = new Set(
    orderedIds.filter((id) => statusOf(progressMap.get(id), threshold) === 'mastered')
  );
  return orderedIds
    .filter((id) => !mastered.has(id) && graph.prerequisites[id].every((p) => mastered.has(p)))
    .slice(0, limit)
    .map((id) => {
      const c = conceptsById.get(id);
      const st = statusOf(progressMap.get(id), threshold);
      return {
        conceptId: c._id,
        concept: c.name,
        difficulty: c.difficulty,
        estimatedHours: c.estimatedHours,
        status: st,
        action: st === 'weak' ? 'revise' : 'study',
      };
    });
}

module.exports = { loadProgressMap, statusOf, annotatePath, recommendNext };
