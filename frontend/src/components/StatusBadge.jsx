import { STATUS } from '../utils/status.js'

export default function StatusBadge({ status, score }) {
  const s = STATUS[status] || STATUS.unassessed
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
      {typeof score === 'number' && status !== 'unassessed' && ` · ${score}%`}
    </span>
  )
}
