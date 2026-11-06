import axios from 'axios'

const TOKEN_KEY = 'prereqgraph_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const t = tokenStore.get()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

// An expired or invalid token logs the user out.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  },
)

export const errorMessage = (err) => err.response?.data?.message || err.message || 'Something went wrong'

export const authApi = {
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.user),
  update: (body) => api.patch('/auth/me', body).then((r) => r.data.user),
}

export const dataApi = {
  subjects: () => api.get('/subjects').then((r) => r.data),
  subjectGraph: (id) => api.get(`/subjects/${id}/graph`).then((r) => r.data),
  concept: (id) => api.get(`/concepts/${id}`).then((r) => r.data),
  conceptGraph: (id) => api.get(`/concepts/${id}/graph`).then((r) => r.data),
  prerequisites: (id) => api.get(`/concepts/${id}/prerequisites`).then((r) => r.data),
  conceptQuiz: (id) => api.get(`/concepts/${id}/quiz`).then((r) => r.data),
  submitQuiz: (quizId, answers) => api.post(`/quizzes/${quizId}/submit`, { answers }).then((r) => r.data),
  dashboard: () => api.get('/users/me/dashboard').then((r) => r.data),
  attempts: () => api.get('/users/me/attempts').then((r) => r.data),
  learningPath: (targetId) => api.get(`/users/me/learning-path/${targetId}`).then((r) => r.data),
  updateProgress: (conceptId, body) => api.patch(`/users/me/progress/${conceptId}`, body).then((r) => r.data),
}

export default api
