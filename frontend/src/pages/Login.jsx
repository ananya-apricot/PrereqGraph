import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../services/api.js'
import { ErrorBox } from '../components/Page.jsx'

export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.email, form.password)
      // GuestOnly redirects to the dashboard once the user is set
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page mx-auto mt-16 max-w-sm px-4">
      <h1 className="auth-title">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to see your learning graph.</p>
      <form onSubmit={submit} className="auth-form mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <ErrorBox message={error} />}
        <label className="block text-sm font-medium">Email
          <input className={`${inputCls} mt-1`} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Password
          <input className={`${inputCls} mt-1`} type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">New here? <Link className="font-medium text-indigo-600" to="/register">Create an account</Link></p>
    </main>
  )
}
