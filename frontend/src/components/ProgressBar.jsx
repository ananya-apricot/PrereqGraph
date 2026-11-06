export default function ProgressBar({ value, color = 'bg-indigo-600' }) {
  const v = Math.max(0, Math.min(100, value || 0))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${v}%` }} />
    </div>
  )
}
