import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  role: string
  role_id?: number
  avatar?: string
  job_title: string
  department_id?: number
  department_name?: string
  salary_base?: number
  status: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('peraka_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('peraka_token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('peraka_token', t)
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('peraka_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
