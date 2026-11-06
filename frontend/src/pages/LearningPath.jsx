import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useProgress from '../hooks/useProgress.js'
import { dataApi, errorMessage } from '../services/api.js'
import { Card, ErrorBox, Loading, Page } from '../components/Page.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ACTION_LABEL, STATUS } from '../utils/status.js'
import { inputCls } from './Login.jsx'

// No target chosen yet: pick a concept from the first subject.
function TargetPicker() {
  const nav = useNavigate()
  const { data, loading, error } = useProgress(async () => {
    const subjects = await dataApi.subjects()
    if (!subjects.length) return { subjects, graph: null }
    const graphs = await Promise.all(subjects.map((s) => dataApi.subjectGraph(s._id)))
    return { subjects, graphs }
  }, [])
  if (loading) return <Loading />
  if (error) return <Page><ErrorBox message={error} /></Page>
  return (
    <Page title="Learning path" subtitle="Choose the concept you want to reach. We will build the shortest personalised route to it.">
      <Card>
        {data.graphs?.map((g) => (
          <label key={g.subject._id} className="block text-sm font-medium">{g.subject.name}
            <select className={`${inputCls} mt-1`} defaultValue="" onChange={(e) => e.target.value && nav(`/path/${e.target.value}`)}>
              <option value="">Select a target concept...</option>
              {[...g.nodes].sort((a, b) => a.name.localeCompare(b.name)).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </label>
        ))}
        {!data.graphs && <p className="text-sm text-slate-500">No subjects available yet.</p>}
      </Card>
    </Page>
  )
}

function PathView({ targetId }) {
  const { data, loading, error, reload } = useProgress(() => dataApi.learningPath(targetId), [targetId])
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState('')

  if (loading && !data) return <Loading />
  if (error) return <Page><ErrorBox message={error} /></Page>

  // Completing a step recalculates the whole path on the server.
  const toggle = async (step) => {
    setBusy(step.conceptId)
    setActionError('')
    try {
      await dataApi.updateProgress(step.conceptId, { completed: step.status !== 'mastered' })
      await reload()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const { learningPath: steps, summary } = data
  const target = steps[steps.length - 1]
  return (
    <Page
      title={`Path to ${data.target}`}
      subtitle={`${summary.prerequisiteCount} prerequisite${summary.prerequisiteCount === 1 ? '' : 's'}, ${summary.unmetPrerequisites} still to master, about ${summary.remainingHours}h of study left.`}
      actions={<div className="flex gap-2">
        <Link to="/path" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Change target</Link>
        <Link to={`/graph/${data.targetId}`} className="hidden" />
      </div>}
    >
      {actionError && <div className="mb-3"><ErrorBox message={actionError} /></div>}
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.conceptId}>
            <Card className={s.isTarget ? 'border-indigo-300 ring-1 ring-indigo-200' : ''}>
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: STATUS[s.status]?.node }}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{s.concept}</h2>
                    {s.isTarget && <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">TARGET</span>}
                    <StatusBadge status={s.status} score={s.masteryScore} />
                    <span className="text-xs capitalize text-slate-400">{s.difficulty} · {s.estimatedHours}h</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-slate-800">{ACTION_LABEL[s.action]}.</span> {s.reason}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  {['take_quiz', 'revise', 'study'].includes(s.action) && (
                    <Link to={`/quiz/${s.conceptId}`} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">Take quiz</Link>
                  )}
                  {s.action !== 'wait' && (
                    <button disabled={busy === s.conceptId} onClick={() => toggle(s)} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-60">
                      {s.status === 'mastered' ? 'Mark incomplete' : 'Mark complete'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      {target.status === 'ready' && <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">All prerequisites are mastered. {data.target} is unlocked.</p>}
    </Page>
  )
}

export default function LearningPath() {
  const { targetId } = useParams()
  return targetId ? <PathView targetId={targetId} /> : <TargetPicker />
}
