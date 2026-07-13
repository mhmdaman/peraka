import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import Layout from './components/Layout'
import { useAuth } from './contexts/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Employees = lazy(() => import('./pages/Employees'))
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Leaves = lazy(() => import('./pages/Leaves'))
const Payroll = lazy(() => import('./pages/Payroll'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Announcements = lazy(() => import('./pages/Announcements'))
const Departments = lazy(() => import('./pages/Departments'))
const Settings = lazy(() => import('./pages/Settings'))

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
    <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
      { path: 'employees', element: <Suspense fallback={<PageLoader />}><Employees /></Suspense> },
      { path: 'employees/:id', element: <Suspense fallback={<PageLoader />}><EmployeeProfile /></Suspense> },
      { path: 'attendance', element: <Suspense fallback={<PageLoader />}><Attendance /></Suspense> },
      { path: 'leaves', element: <Suspense fallback={<PageLoader />}><Leaves /></Suspense> },
      { path: 'payroll', element: <Suspense fallback={<PageLoader />}><Payroll /></Suspense> },
      { path: 'tasks', element: <Suspense fallback={<PageLoader />}><Tasks /></Suspense> },
      { path: 'announcements', element: <Suspense fallback={<PageLoader />}><Announcements /></Suspense> },
      { path: 'departments', element: <Suspense fallback={<PageLoader />}><Departments /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><Settings /></Suspense> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
