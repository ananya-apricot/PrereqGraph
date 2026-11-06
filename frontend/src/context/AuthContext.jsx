import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, tokenStore } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false))
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const login = async (email, password) => {
    const { token, user } = await authApi.login({ email, password })
    tokenStore.set(token)
    setUser(user)
  }
  const register = async (name, email, password) => {
    const { token, user } = await authApi.register({ name, email, password })
    tokenStore.set(token)
    setUser(user)
  }
  const updateProfile = async (body) => setUser(await authApi.update(body))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
