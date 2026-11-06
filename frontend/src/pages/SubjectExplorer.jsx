import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProgress from '../hooks/useProgress.js'
import { dataApi } from '../services/api.js'
import { Card, ErrorBox, Loading, Page } from '../components/Page.jsx'
import ConceptCard from '../components/ConceptCard.jsx'
import { inputCls } from './Login.jsx'

function SubjectList() {
  const { data, loading, error } = useProgress(() => dataApi.subjects(), [])
  if (loading) return <Loading />
  if (error) return <Page><ErrorBox message={error} /></Page>
  return (
    <Page title="Subjects" subtitle="Pick a subject to explore its concepts and prerequisite graph.">
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((s) => (
          <Card key={s._id}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{s.code}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{s.description}</p>
            <p className="mt-3 text-sm text-slate-600">{s.conceptCount} concepts</p>
            <div className="mt-4 flex gap-2">
              <Link to={`/subjects/${s._id}`} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Explore concepts</Link>
              <Link to={`/graph/${s._id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Open graph</Link>
            </div>
          </Card>
        ))}
        {data.length === 0 && <p className="text-sm text-slate-500">No subjects yet. Run the seed script on the backend.</p>}
      </div>
    </Page>
  )
}

function ConceptList({ subjectId }) {
  const { data, loading, error } = useProgress(() => dataApi.subjectGraph(subjectId), [subjectId])
  const [q, setQ] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')

  const shown = useMemo(() => {
    if (!data) return []
    return data.nodes
      .filter((n) => n.name.toLowerCase().includes(q.toLowerCase()))
      .filter((n) => difficulty === 'all' || n.difficulty === difficulty)
      .filter((n) => status === 'all' || n.status === status)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  }, [data, q, difficulty, status])

  if (loading) return <Loading />
  if (error) return <Page><ErrorBox message={error} /></Page>

  return (
    <Page
      title={data.subject.name}
      subtitle={`${data.nodes.length} concepts, ordered from foundations to advanced topics.`}
      actions={<Link to={`/graph/${subjectId}`} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Open graph</Link>}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input className={inputCls} placeholder="Search concepts" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="all">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="mastered">Mastered</option>
          <option value="weak">Needs work</option>
          <option value="unassessed">Not assessed</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((n) => <ConceptCard key={n.id} concept={n} subjectId={subjectId} />)}
      </div>
      {shown.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No concepts match your filters.</p>}
    </Page>
  )
}

export default function SubjectExplorer() {
  const { subjectId } = useParams()
  return subjectId ? <ConceptList subjectId={subjectId} /> : <SubjectList />
}
