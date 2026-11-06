// Shared page wrapper plus loading / error placeholders.
export function Page({ title, subtitle, actions, children, wide }) {
  return (
    <main className={`app-page mx-auto px-4 py-6 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
      {(title || actions) && (
        <div className="page-heading mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </main>
  )
}

export const Loading = ({ text = 'Loading...' }) => <p className="loading-state py-10 text-center">{text}</p>

export const ErrorBox = ({ message }) => (
  <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>
)

export const Card = ({ children, className = '' }) => (
  <section className={`surface-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
)
