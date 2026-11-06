// Presentation helpers for concept status. The statuses themselves come from the backend.
export const STATUS = {
  mastered: { label: 'Mastered', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', node: '#88c58b', fill: '#263b31' },
  weak: { label: 'Needs work', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-amber-200', node: '#f4ba5e', fill: '#403527' },
  unassessed: { label: 'Not assessed', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 ring-slate-200', node: '#a39c7c', fill: '#303a36' },
  ready: { label: 'Ready', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-blue-200', node: '#83b9cb', fill: '#2a3940' },
  locked: { label: 'Locked', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 ring-slate-200', node: '#817e6b', fill: '#2a332f' },
}

export const ACTION_LABEL = {
  skip: 'Skip (mastered)',
  revise: 'Revise',
  take_quiz: 'Take quiz',
  wait: 'Locked',
  study: 'Study',
  done: 'Done',
}
