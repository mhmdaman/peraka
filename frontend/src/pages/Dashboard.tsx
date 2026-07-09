import { useEffect, useState } from 'react'
import { Users, Clock, CalendarDays, CheckSquare, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import StatCard from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

interface DashboardData {
  stats: {
    total_employees: number
    present_today: number
    pending_leaves: number
    pending_tasks: number
    total_departments: number
  }
  attendanceTrend: Array<{ date: string; count: number; status: string }>
  announcements: Array<{ id: number; title: string; created_at: string; author: string }>
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.875rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const stats = data?.stats

  // Aggregate attendance trend by date
  const attendanceByDate: Record<string, Record<string, number>> = {}
  data?.attendanceTrend.forEach(row => {
    if (!attendanceByDate[row.date]) attendanceByDate[row.date] = {}
    attendanceByDate[row.date][row.status] = row.count
  })
  const attendanceChart = Object.entries(attendanceByDate).map(([date, s]) => ({
    date: date.slice(5),
    present: s.present ?? 0,
    late: s.late ?? 0,
    absent: s.absent ?? 0,
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}, {user?.first_name}
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid — 5 cards, no payroll */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="Total Employees" value={stats?.total_employees ?? 0} icon={Users} />
        <StatCard title="Present Today"   value={stats?.present_today ?? 0}   icon={Clock}        subtitle={`of ${stats?.total_employees ?? 0} active`} />
        <StatCard title="Pending Leaves"  value={stats?.pending_leaves ?? 0}  icon={CalendarDays} />
        <StatCard title="Pending Tasks"   value={stats?.pending_tasks ?? 0}   icon={CheckSquare}  />
        <StatCard title="Departments"     value={stats?.total_departments ?? 0} icon={Building2}  />
      </div>

      {/* Bottom row: Attendance chart + Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>

        {/* Attendance chart */}
        <div className="card">
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
            Attendance — Last 7 Days
          </p>
          {attendanceChart.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceChart} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="present" fill="#e5e5e5" radius={[3,3,0,0]} name="Present" />
                <Bar dataKey="late"    fill="#737373" radius={[3,3,0,0]} name="Late" />
                <Bar dataKey="absent"  fill="#404040" radius={[3,3,0,0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No attendance data yet
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Latest Announcements
          </p>
          {data?.announcements.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {data.announcements.slice(0, 5).map(a => (
                <div key={a.id} style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{a.title}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {a.author} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', paddingTop: '0.5rem' }}>No announcements yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
