import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProgress from '../hooks/useProgress.js'
import { dataApi, errorMessage } from '../services/api.js'
import { Card, ErrorBox, Loading, Page } from '../components/Page.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function DiagnosticQuiz() {
  const { conceptId } = useParams()
  const { data, loading, error, reload } = useProgress(async () => {
    const [concept, quiz] = await Promise.all([dataApi.concept(conceptId), dataApi.conceptQuiz(conceptId)])
    return { concept, quiz }
  }, [conceptId])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <Loading />
  if (error) return <Page><ErrorBox message={error} /><Link className="mt-3 inline-block text-sm text-indigo-600" to="/subjects">Back to subjects</Link></Page>

  const { concept, quiz } = data
  const answered = Object.keys(answers).length

  const submit = async () => {
    setBusy(true)
    setSubmitError('')
    try {
      const body = quiz.questions.map((q) => ({ questionId: q._id, selected: answers[q._id] ?? -1 })).filter((a) => a.selected >= 0)
      setResult(await dataApi.submitQuiz(quiz._id, body))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const retry = () => { setAnswers({}); setResult(null); reload() }
  const byId = result ? Object.fromEntries(result.results.map((r) => [r.questionId, r])) : {}

  return (
    <Page title={`Diagnostic quiz: ${concept.name}`} subtitle="Harder questions are worth more points. Unanswered questions count as wrong.">
      {result && (
        <Card className="mb-5 border-indigo-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-3xl font-bold">{result.score}%</p>
              <p className="text-sm text-slate-500">{result.correct} of {result.total} correct · mastery threshold {result.threshold}%</p>
            </div>
            <StatusBadge status={result.status} score={result.score} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {result.status === 'mastered'
              ? 'Mastered. Your graph and learning paths have been updated.'
              : 'Not mastered yet. This concept is marked as needing work and will show up in your revision list.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link to={`/path/${conceptId}`} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">See learning path</Link>
            <Link to={`/graph/${concept.subjectId}?focus=${conceptId}`} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">View graph</Link>
            <button onClick={retry} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">Retake quiz</button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {quiz.questions.map((q, i) => {
          const r = byId[q._id]
          return (
            <Card key={q._id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-medium"><span className="mr-2 text-slate-400">{i + 1}.</span>{q.question}</h2>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500">{q.difficulty}</span>
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, idx) => {
                  const chosen = (r ? r.selected : answers[q._id]) === idx
                  let cls = 'border-slate-200 hover:bg-slate-50'
                  if (r) {
                    if (idx === r.correctAnswer) cls = 'border-emerald-400 bg-emerald-50'
                    else if (chosen) cls = 'border-rose-400 bg-rose-50'
                    else cls = 'border-slate-200 opacity-70'
                  } else if (chosen) cls = 'border-indigo-500 bg-indigo-50'
                  return (
                    <label key={idx} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${cls} ${r ? 'cursor-default' : ''}`}>
                      <input type="radio" name={q._id} disabled={!!result} checked={chosen} onChange={() => setAnswers({ ...answers, [q._id]: idx })} />
                      {opt}
                    </label>
                  )
                })}
              </div>
              {r && <p className={`mt-2 text-sm font-medium ${r.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{r.isCorrect ? 'Correct' : 'Incorrect'}</p>}
            </Card>
          )
        })}
      </div>

      {!result && (
        <div className="mt-5 flex items-center gap-4">
          <button disabled={busy || answered === 0} onClick={submit} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit answers'}
          </button>
          <span className="text-sm text-slate-500">{answered} of {quiz.questions.length} answered</span>
          {submitError && <span className="text-sm text-rose-600">{submitError}</span>}
        </div>
      )}
    </Page>
  )
}
