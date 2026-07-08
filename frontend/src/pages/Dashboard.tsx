import { useEffect, useState } from 'react'
import { Users, Clock, CalendarDays, CreditCard, CheckSquare, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import StatCard from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

interface DashboardData {
  stats: {
    total_employees: number
    present_today: number
    pending_leaves: number
    total_payroll: number
    pending_tasks: number
    total_departments: number
  }
  attendanceTrend: Array<{ date: string; count: number; status: string }>
  deptHeadcount: Array<{ name: string; count: number }>
  payrollTrend: Array<{ month: number; year: number; total: number }>
  announcements: Array<{ id: number; title: string; created_at: string; author: string }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}: {p.value}</p>
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
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

  const payrollChart = data?.payrollTrend.map(p => ({
    name: `${monthNames[p.month - 1]} ${p.year}`,
    total: Math.round(p.total / 1000),
  })) ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.first_name}</span> 👋
          </h1>
          <p className="page-subtitle">Here's what's happening at your company today</p>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.875rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard title="Total Employees" value={stats?.total_employees ?? 0} icon={Users} color="#6366f1" trend={5} />
        <StatCard title="Present Today" value={stats?.present_today ?? 0} icon={Clock} color="#10b981" subtitle={`of ${stats?.total_employees ?? 0} active`} />
        <StatCard title="Pending Leaves" value={stats?.pending_leaves ?? 0} icon={CalendarDays} color="#f59e0b" />
        <StatCard title="Payroll (This Month)" value={`₹${((stats?.total_payroll ?? 0) / 1000).toFixed(0)}K`} icon={CreditCard} color="#8b5cf6" />
        <StatCard title="Pending Tasks" value={stats?.pending_tasks ?? 0} icon={CheckSquare} color="#ef4444" />
        <StatCard title="Departments" value={stats?.total_departments ?? 0} icon={Building2} color="#3b82f6" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Attendance chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Attendance — Last 7 Days</h3>
          {attendanceChart.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceChart} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="present" fill="#10b981" radius={[4,4,0,0]} name="Present" />
                <Bar dataKey="late" fill="#f59e0b" radius={[4,4,0,0]} name="Late" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No attendance data yet</div>
          )}
        </div>

        {/* Dept headcount */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Headcount by Department</h3>
          {data?.deptHeadcount.length ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.deptHeadcount} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={4}>
                    {data.deptHeadcount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                {data.deptHeadcount.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No department data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
        {/* Payroll trend */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Payroll Trend (₹K)</h3>
          {payrollChart.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={payrollChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} name="Payroll ₹K" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payroll data yet</div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Latest Announcements</h3>
          {data?.announcements.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.announcements.slice(0, 4).map(a => (
                <div key={a.id} style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{a.title}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {a.author} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingTop: '1rem' }}>No announcements yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
