import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../services/api.js'
import { ErrorBox } from '../components/Page.jsx'
import { inputCls } from './Login.jsx'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      // GuestOnly redirects to the dashboard once the user is set
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page mx-auto mt-16 max-w-sm px-4">
      <h1 className="auth-title">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Find the gaps. Follow the path.</p>
      <form onSubmit={submit} className="auth-form mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && <ErrorBox message={error} />}
        <label className="block text-sm font-medium">Name
          <input className={`${inputCls} mt-1`} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Email
          <input className={`${inputCls} mt-1`} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Password
          <input className={`${inputCls} mt-1`} type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <span className="text-xs font-normal text-slate-500">At least 6 characters</span>
        </label>
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link className="font-medium text-indigo-600" to="/login">Log in</Link></p>
    </main>
  )
}
