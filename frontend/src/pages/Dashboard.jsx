import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import useProgress from '../hooks/useProgress.js'
import { dataApi } from '../services/api.js'
import { Card, ErrorBox, Loading, Page } from '../components/Page.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading, error } = useProgress(() => dataApi.dashboard(), [])

  if (loading) return <Loading />
  if (error) return <Page><ErrorBox message={error} /></Page>

  const attempted = data.recentAttempts.length > 0
  return (
    <Page title={`Hi ${user.name.split(' ')[0]}`} subtitle={`Mastery threshold: ${data.threshold}%. Change it on your profile.`}>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {data.subjects.map((s) => (
            <Card key={s.subject._id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{s.subject.name}</h2>
                  <p className="text-sm text-slate-500">{s.mastered} of {s.total} concepts mastered</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/subjects/${s.subject._id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Concepts</Link>
                  <Link to={`/graph/${s.subject._id}`} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Open graph</Link>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={s.percentMastered} color="bg-emerald-500" />
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">{s.mastered} mastered</span>
                  <span className="font-semibold text-amber-600">{s.weak} need work</span>
                  <span>{s.unassessed} not assessed</span>
                  <span className="ml-auto font-semibold text-slate-700">{s.percentMastered}%</span>
                </div>
              </div>
              <h3 className="mt-5 text-sm font-semibold text-slate-700">Recommended next</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {s.next.map((n) => (
                  <li key={n.conceptId} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{n.concept}</span>
                      <span className="ml-2 text-xs text-slate-400">{n.estimatedHours}h · {n.difficulty}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={n.status} />
                      <Link className="font-medium text-indigo-600 hover:underline" to={`/quiz/${n.conceptId}`}>Quiz</Link>
                      <Link className="font-medium text-indigo-600 hover:underline" to={`/path/${n.conceptId}`}>Path</Link>
                    </span>
                  </li>
                ))}
                {s.next.length === 0 && <li className="py-2 text-sm text-slate-500">Everything here is mastered. Nice work.</li>}
              </ul>
            </Card>
          ))}
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="font-semibold">Weak concepts</h2>
            {data.weakConcepts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">None yet. Take a diagnostic quiz to find out where you stand.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.weakConcepts.map((w) => (
                  <li key={w.conceptId} className="flex items-center justify-between text-sm">
                    <Link to={`/path/${w.conceptId}`} className="font-medium hover:text-indigo-600">{w.concept}</Link>
                    <span className="text-amber-600">{w.masteryScore}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Recent assessments</h2>
            {!attempted ? (
              <p className="mt-2 text-sm text-slate-500">No quizzes taken yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {data.recentAttempts.map((a) => (
                  <li key={a._id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-medium">{a.concept}</span>
                      <span className="block text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                    </span>
                    <span className={`font-semibold ${a.score >= data.threshold ? 'text-emerald-600' : 'text-amber-600'}`}>{a.score}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  )
}
