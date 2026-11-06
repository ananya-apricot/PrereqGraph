import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../services/api.js'

// Small data-loading hook: run an async loader, expose { data, loading, error, reload }.
export default function useProgress(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }))
      setState({ data: await loader(), loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: errorMessage(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
