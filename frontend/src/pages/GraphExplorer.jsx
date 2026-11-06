import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Background, Controls, MarkerType, ReactFlow } from '@xyflow/react'
import { dataApi, errorMessage } from '../services/api.js'
import { ErrorBox, Loading, Page } from '../components/Page.jsx'
import GraphNode from '../components/GraphNode.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { STATUS } from '../utils/status.js'
import { layoutNodes } from '../utils/layout.js'

const nodeTypes = { concept: GraphNode }

export default function GraphExplorer() {
  const { subjectId } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const focus = params.get('focus') // when set, only this concept and its prerequisites are shown

  const [graph, setGraph] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null) // { prerequisites, directPrerequisites } from the backend
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setGraph(focus ? await dataApi.conceptGraph(focus) : await dataApi.subjectGraph(subjectId))
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [focus, subjectId])

  useEffect(() => { load() }, [load])

  // Selecting a node asks the backend for its prerequisites (the UI does not compute dependencies itself).
  useEffect(() => {
    if (!selected) { setDetail(null); return }
    let cancelled = false
    dataApi.prerequisites(selected).then((d) => { if (!cancelled) setDetail(d) }).catch(() => {})
    return () => { cancelled = true }
  }, [selected])

  const highlight = useMemo(() => {
    if (!selected || !detail) return null
    return new Set([selected, ...detail.prerequisites.map((p) => p._id)])
  }, [selected, detail])

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }
    const pos = layoutNodes(graph.nodes, graph.edges)
    const target = focus || null
    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        type: 'concept',
        position: pos[n.id],
        data: { ...n, isTarget: n.id === target, selected: n.id === selected, dim: highlight ? !highlight.has(n.id) : false },
      })),
      edges: graph.edges.map((e) => {
        const on = highlight ? highlight.has(e.source) && highlight.has(e.target) : false
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: on,
          markerEnd: { type: MarkerType.ArrowClosed, color: on ? '#e4a04e' : '#9c987d' },
          style: { stroke: on ? '#e4a04e' : '#9c987d', strokeWidth: on ? 2.5 : 1.5, opacity: highlight && !on ? 0.15 : 1 },
        }
      }),
    }
  }, [graph, selected, highlight, focus])

  const node = graph?.nodes.find((n) => n.id === selected)

  const markComplete = async () => {
    setBusy(true)
    try {
      await dataApi.updateProgress(node.id, { completed: node.status !== 'mastered' })
      await load() // the graph updates straight away
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (error && !graph) return <Page><ErrorBox message={error} /></Page>
  if (!graph) return <Loading />

  return (
    <Page
      wide
      title={focus ? `Prerequisites: ${graph.nodes.find((n) => n.id === focus)?.name}` : 'Concept graph'}
      subtitle="Arrows point from a prerequisite to the concept it unlocks. Click a concept to inspect it."
      actions={
        <div className="flex gap-2">
          {focus && (
            <button onClick={() => { setParams({}); setSelected(null) }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Show full graph
            </button>
          )}
          <Link to={`/subjects/${subjectId}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Concept list</Link>
        </div>
      }
    >
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {['mastered', 'weak', 'unassessed'].map((k) => (
          <span key={k} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-full ${STATUS[k].dot}`} />{STATUS[k].label}</span>
        ))}
        {focus && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-emerald-500" />Target</span>}
        <span className="text-slate-400">Threshold: {graph.threshold}%</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="graph-panel h-[70vh] w-full flex-none overflow-hidden rounded-xl border border-slate-200 bg-white lg:flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            nodesConnectable={false}
            onNodeClick={(_, n) => setSelected(n.id)}
            onPaneClick={() => setSelected(null)}
          >
            <Background gap={20} color="#e2e8f0" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <aside className="surface-card w-full shrink-0 rounded-xl border border-slate-200 bg-white p-4 lg:w-80">
          {!node ? (
            <p className="text-sm text-slate-500">Select a concept to see its details, its prerequisites and what you can do next.</p>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{node.name}</h2>
              <div className="mt-1"><StatusBadge status={node.status} score={node.masteryScore} /></div>
              <p className="mt-3 text-sm text-slate-600">{node.description}</p>
              <p className="mt-2 text-xs capitalize text-slate-400">{node.difficulty} · {node.estimatedHours}h</p>

              <h3 className="mt-4 text-sm font-semibold">Prerequisites in learning order</h3>
              {!detail ? (
                <p className="mt-1 text-sm text-slate-400">Loading...</p>
              ) : detail.prerequisites.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">None. This is a foundation concept.</p>
              ) : (
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-slate-700">
                  {detail.prerequisites.map((p) => {
                    const st = graph.nodes.find((n) => n.id === p._id)?.status
                    return <li key={p._id}>{p.name} <span className={`ml-1 inline-block h-2 w-2 rounded-full ${STATUS[st]?.dot}`} /></li>
                  })}
                </ol>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <button onClick={() => nav(`/quiz/${node.id}`)} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">Take quiz</button>
                <button onClick={() => nav(`/path/${node.id}`)} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">Learning path</button>
                {!focus && (
                  <button onClick={() => { setParams({ focus: node.id }); setSelected(null) }} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">Focus graph</button>
                )}
                <button disabled={busy} onClick={markComplete} className="rounded-md border border-emerald-300 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                  {node.status === 'mastered' ? 'Mark incomplete' : 'Mark complete'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </Page>
  )
}
