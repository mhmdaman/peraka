import { useEffect, useState } from 'react'
import { Users, CalendarDays, CheckSquare, Building2, Check, X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { Link } from 'react-router-dom'

// ── shared helpers ────────────────────────────────────────────────────────────

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  pending_manager: { label: 'Awaiting Manager', color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  pending_admin:   { label: 'Awaiting HR',      color: '#93c5fd', bg: 'rgba(147,197,253,0.1)' },
  approved:        { label: 'Approved',          color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  rejected:        { label: 'Rejected',          color: '#fca5a5', bg: 'rgba(252,165,165,0.1)' },
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusLabel[status] ?? { label: status, color: '#a3a3a3', bg: 'rgba(163,163,163,0.1)' }
  return (
    <span style={{ padding: '0.18rem 0.55rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const MONO_COLORS = ['#f5f5f5', '#a3a3a3', '#737373', '#525252', '#404040', '#2e2e2e']

const CardHeading = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
    {children}
  </p>
)

// ── Admin Dashboard ───────────────────────────────────────────────────────────

function AdminDashboard({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as Record<string, number>
  const pending = data.pendingLeaveList as Array<Record<string, unknown>>
  const dept = data.deptHeadcount as Array<{ name: string; count: number }>
  const announcements = data.announcements as Array<Record<string, unknown>>
  const [acting, setActing] = useState<number | null>(null)

  const handleAdminAction = async (id: number, action: 'approve' | 'reject') => {
    setActing(id)
    try {
      await api.put(`/leaves/${id}/admin-review`, { action })
      window.location.reload()
    } catch (e) {
      console.error(e)
      setActing(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard title="Total Employees"  value={stats.total_employees}    icon={Users} />
        <StatCard title="Departments"      value={stats.total_departments}  icon={Building2} />
        <StatCard title="Leave Requests (HR)" value={stats.pending_admin_leaves} icon={CalendarDays} />
        <StatCard title="Open Tasks"       value={stats.pending_tasks}      icon={CheckSquare} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
        {/* Pending leave approvals */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <CardHeading>Leave Requests — Awaiting HR Approval</CardHeading>
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No pending leave requests
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    {['Employee', 'Type', 'Days', 'Manager Note', ''].map(h => (
                      <th key={h} style={{ padding: '0.65rem 1rem', textAlign: h === '' ? 'right' : 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((l: Record<string, unknown>) => (
                    <tr key={l.id as number} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.employee_name as string}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.job_title as string}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{l.type as string}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.days as number}d</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(l.manager_comment as string) || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleAdminAction(l.id as number, 'approve')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(110,231,183,0.12)', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleAdminAction(l.id as number, 'reject')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(252,165,165,0.1)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dept headcount + announcements stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <CardHeading>Headcount by Department</CardHeading>
            {dept.length ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={dept} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30} paddingAngle={3}>
                      {dept.map((_, i) => <Cell key={i} fill={MONO_COLORS[i % MONO_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {dept.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: MONO_COLORS[i % MONO_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No departments yet</div>
            )}
          </div>

          <div className="card" style={{ flex: 1 }}>
            <CardHeading>Announcements</CardHeading>
            <AnnouncementList items={announcements} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Manager Dashboard ─────────────────────────────────────────────────────────

function ManagerDashboard({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as Record<string, number>
  const pending = data.pendingLeaveList as Array<Record<string, unknown>>
  const team = data.teamMembers as Array<Record<string, unknown>>
  const announcements = data.announcements as Array<Record<string, unknown>>
  const [acting, setActing] = useState<number | null>(null)

  const handleManagerAction = async (id: number, action: 'forward' | 'reject') => {
    setActing(id)
    try {
      await api.put(`/leaves/${id}/manager-review`, { action })
      window.location.reload()
    } catch (e) {
      console.error(e)
      setActing(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard title="Total Employees"    value={stats.team_size}              icon={Users} />
        <StatCard title="Pending Reviews"    value={stats.pending_manager_leaves} icon={CalendarDays} />
        <StatCard title="Open Tasks"         value={stats.pending_tasks}          icon={CheckSquare} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        {/* Leave requests to review */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <CardHeading>Leave Requests — Awaiting Your Review</CardHeading>
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending leave requests</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    {['Employee', 'Type', 'Days', 'Reason', ''].map(h => (
                      <th key={h} style={{ padding: '0.65rem 1rem', textAlign: h === '' ? 'right' : 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((l: Record<string, unknown>) => (
                    <tr key={l.id as number} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.employee_name as string}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.job_title as string}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{l.type as string}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.days as number}d</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.reason as string}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleManagerAction(l.id as number, 'forward')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(147,197,253,0.12)', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={12} /> Forward
                          </button>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleManagerAction(l.id as number, 'reject')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(252,165,165,0.1)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Employees + announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <CardHeading>Employees</CardHeading>
            {team.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No employees found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {team.map((m: Record<string, unknown>) => (
                  <div key={m.id as number} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {(m.first_name as string)[0]}{(m.last_name as string)[0]}
                    </div>
                    <div>
                      <Link to={`/employees/${m.id}`} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {m.first_name as string} {m.last_name as string}
                      </Link>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.job_title as string}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ flex: 1 }}>
            <CardHeading>Announcements</CardHeading>
            <AnnouncementList items={announcements} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Employee Dashboard ────────────────────────────────────────────────────────

function EmployeeDashboard({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as Record<string, number>
  const balances = data.balances as Array<{ type: string; balance: number }>
  const myLeaves = data.myLeaves as Array<Record<string, unknown>>
  const myTasks = data.myTasks as Array<Record<string, unknown>>
  const announcements = data.announcements as Array<Record<string, unknown>>

  const priorityColor: Record<string, string> = {
    urgent: '#fca5a5', high: '#fcd34d', medium: '#a3a3a3', low: '#525252'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        <StatCard title="Pending Leaves"  value={stats.pending_leaves}      icon={CalendarDays} />
        <StatCard title="Leave Taken"     value={stats.total_leaves_taken}  icon={CalendarDays} />
        <StatCard title="Assigned Tasks"  value={stats.pending_tasks}       icon={CheckSquare} />
      </div>

      {/* Leave balances */}
      <div className="card">
        <CardHeading>Leave Balance</CardHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {balances.map(b => (
            <div key={b.type} style={{ padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{b.type}</div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{b.balance}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>days remaining</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* My recent leaves */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <CardHeading>My Leave Requests</CardHeading>
            <Link to="/leaves" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {myLeaves.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No leave requests yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myLeaves.map((l: Record<string, unknown>) => (
                <div key={l.id as number} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{l.type as string} leave</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.days as number} day{(l.days as number) > 1 ? 's' : ''}</div>
                  </div>
                  <StatusBadge status={l.status as string} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My tasks + announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <CardHeading>My Tasks</CardHeading>
              <Link to="/tasks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>View all →</Link>
            </div>
            {myTasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No open tasks</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myTasks.map((t: Record<string, unknown>) => (
                  <div key={t.id as number} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor[t.priority as string] ?? '#a3a3a3', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{t.title as string}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Due {new Date(t.due_date as string).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ flex: 1 }}>
            <CardHeading>Announcements</CardHeading>
            <AnnouncementList items={announcements} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared: announcement list ─────────────────────────────────────────────────

function AnnouncementList({ items }: { items: Array<Record<string, unknown>> }) {
  if (!items.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No announcements yet</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(a => (
        <div key={a.id as number} style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{a.title as string}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {a.author as string} · {new Date(a.created_at as string).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}

// ── Root Dashboard (dispatcher) ───────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {greeting}, {user?.first_name}
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {data && user?.role === 'admin'    && <AdminDashboard    data={data} />}
      {data && user?.role === 'manager'  && <ManagerDashboard  data={data} />}
      {data && user?.role === 'employee' && <EmployeeDashboard data={data} />}
    </div>
  )
}
