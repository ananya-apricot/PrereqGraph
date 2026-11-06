import { Handle, Position } from '@xyflow/react'
import { STATUS } from '../utils/status.js'

// Custom React Flow node: colour = student's status, blue ring = target, dimmed = not related to the selection.
export default function GraphNode({ data }) {
  const s = STATUS[data.status] || STATUS.unassessed
  return (
    <div
      className={`graph-node w-[210px] rounded-lg border-2 px-3 py-2 text-left shadow-sm transition-opacity ${data.dim ? 'opacity-30' : ''} ${data.selected ? 'ring-4 ring-amber-400' : ''}`}
      style={{ borderColor: data.isTarget ? '#88c58b' : s.node, background: s.fill, borderWidth: data.isTarget ? 3 : 2 }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-slate-400" />
      <div className="graph-node-name font-semibold text-slate-900">{data.name}</div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: s.node }} />
          {s.label}{typeof data.masteryScore === 'number' && data.status !== 'unassessed' ? ` ${data.masteryScore}%` : ''}
        </span>
        <span>{data.estimatedHours}h</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  )
}
