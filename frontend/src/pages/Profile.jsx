import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import useProgress from '../hooks/useProgress.js'
import { dataApi, errorMessage } from '../services/api.js'
import { Card, ErrorBox, Page } from '../components/Page.jsx'
import { inputCls } from './Login.jsx'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { data: attempts } = useProgress(() => dataApi.attempts(), [])
  const [name, setName] = useState(user.name)
  const [threshold, setThreshold] = useState(user.masteryThreshold)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { setName(user.name); setThreshold(user.masteryThreshold) }, [user])

  const save = async (e) => {
    e.preventDefault()
    setMsg(''); setError('')
    try {
      await updateProfile({ name, masteryThreshold: Number(threshold) })
      setMsg('Saved. Your graph and paths now use the new threshold.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Page title="Profile" subtitle={user.email}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Learning preferences</h2>
          <form onSubmit={save} className="mt-4 space-y-4">
            {error && <ErrorBox message={error} />}
            {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
            <label className="block text-sm font-medium">Name
              <input className={`${inputCls} mt-1`} value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm font-medium">Mastery threshold: {threshold}%
              <input className="mt-2 w-full" type="range" min="40" max="100" step="5" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              <span className="text-xs font-normal text-slate-500">A concept counts as mastered when your quiz score reaches this level. Prerequisites must be mastered before a target unlocks.</span>
            </label>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save changes</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Assessment history</h2>
          {!attempts || attempts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No quiz attempts yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="pb-1">Concept</th><th>Score</th><th className="text-right">When</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a) => (
                  <tr key={a._id}>
                    <td className="py-1.5 font-medium">{a.concept}</td>
                    <td className={a.score >= user.masteryThreshold ? 'text-emerald-600' : 'text-amber-600'}>{a.score}% <span className="text-xs text-slate-400">({a.correct}/{a.total})</span></td>
                    <td className="text-right text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </Page>
  )
}
