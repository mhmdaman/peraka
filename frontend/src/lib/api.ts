import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Restore token from storage
const token = localStorage.getItem('peraka_token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

// Response interceptor — auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('peraka_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
