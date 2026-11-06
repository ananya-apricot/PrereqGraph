import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const link = ({ isActive }) =>
  `nav-link rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="site-header sticky top-0 z-20">
      <div className="site-header-content mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="brand-link mr-4 flex items-center gap-2 font-bold text-slate-900">
          <span className="brand-mark grid h-8 w-8 place-items-center rounded-md bg-indigo-600 text-sm text-white">P</span>
          PrereqGraph
        </Link>
        {user && (
          <nav className="nav-items flex flex-1 items-center gap-1">
            <NavLink to="/" end className={link}>Dashboard</NavLink>
            <NavLink to="/subjects" className={link}>Subjects</NavLink>
            <NavLink to="/path" className={link}>Learning path</NavLink>
            <NavLink to="/profile" className={link}>Profile</NavLink>
          </nav>
        )}
        {user && (
          <div className="ml-auto flex shrink-0 items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user.name}</span>
            <button onClick={logout} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
