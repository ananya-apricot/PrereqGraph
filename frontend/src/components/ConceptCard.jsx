import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'

const diffColor = { beginner: 'text-emerald-600', intermediate: 'text-amber-600', advanced: 'text-rose-600' }

export default function ConceptCard({ concept, subjectId }) {
  return (
    <div className="concept-card flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{concept.name}</h3>
        <StatusBadge status={concept.status} score={concept.masteryScore} />
      </div>
      <p className="mt-1 flex-1 text-sm text-slate-500">{concept.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`font-medium capitalize ${diffColor[concept.difficulty]}`}>{concept.difficulty}</span>
        <span className="text-slate-400">{concept.estimatedHours}h</span>
      </div>
      <div className="mt-3 flex gap-2 text-sm">
        <Link className="rounded-md bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-700" to={`/quiz/${concept.id}`}>Quiz</Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50" to={`/path/${concept.id}`}>Path</Link>
        <Link className="rounded-md border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50" to={`/graph/${subjectId}?focus=${concept.id}`}>Graph</Link>
      </div>
    </div>
  )
}
