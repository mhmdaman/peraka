import { useEffect, useState } from 'react'
import { Users, CalendarDays, CheckSquare, Building2, Check, X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { Link } from 'react-router-dom'

// ── shared helpers ────────────────────────────────────────────────────────────

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  pending_manager: { label: 'Awaiting Manager', color: 'var(--warning)', bg: 'rgba(139,122,62,0.08)' },
  pending_admin:   { label: 'Awaiting HR',      color: 'var(--info)',    bg: 'rgba(62,92,122,0.08)' },
  approved:        { label: 'Approved',          color: 'var(--success)', bg: 'rgba(74,109,92,0.08)' },
  rejected:        { label: 'Rejected',          color: 'var(--danger)',  bg: 'rgba(122,59,59,0.08)' },
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusLabel[status] ?? { label: status, color: 'var(--text-muted)', bg: 'rgba(138,141,137,0.08)' }
  return (
    <span style={{ padding: '0.2rem 0.55rem', borderRadius: 2, fontSize: '0.68rem', fontWeight: 600, background: s.bg, color: s.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  )
}

// Ink wash monochrome palette for pie chart
const INK_COLORS = ['#2C302E', '#4A4E4C', '#626864', '#8A8D89', '#A8ABA7', '#C5C8C4']

const CardHeading = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.01em', marginBottom: '1rem' }}>
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
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              No pending leave requests
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Employee', 'Type', 'Days', 'Manager Note', ''].map(h => (
                      <th key={h} style={{ padding: '0.65rem 1rem', textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((l: Record<string, unknown>) => (
                    <tr key={l.id as number}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.employee_name as string}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.job_title as string}</div>
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
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(74,109,92,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleAdminAction(l.id as number, 'reject')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(122,59,59,0.08)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
                      {dept.map((_, i) => <Cell key={i} fill={INK_COLORS[i % INK_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', fontFamily: 'var(--font-body)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {dept.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 1, background: INK_COLORS[i % INK_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>No departments yet</div>
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
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No pending leave requests</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Employee', 'Type', 'Days', 'Reason', ''].map(h => (
                      <th key={h} style={{ padding: '0.65rem 1rem', textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((l: Record<string, unknown>) => (
                    <tr key={l.id as number}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.employee_name as string}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.job_title as string}</div>
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
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(62,92,122,0.1)', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={12} /> Forward
                          </button>
                          <button
                            disabled={acting === l.id as number}
                            onClick={() => handleManagerAction(l.id as number, 'reject')}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(122,59,59,0.08)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>No employees found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {team.map((m: Record<string, unknown>) => (
                  <div key={m.id as number} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(44,48,46,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
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
  const [myTasks, setMyTasks] = useState<Array<Record<string, unknown>>>(data.myTasks as Array<Record<string, unknown>>)
  const announcements = data.announcements as Array<Record<string, unknown>>

  const priorityColor: Record<string, string> = {
    urgent: 'var(--danger)', high: 'var(--warning)', medium: 'var(--text-muted)', low: 'var(--text-muted)'
  }

  const handleCompleteTask = async (id: number) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: 'completed' })
      setMyTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
    }
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
            <div key={b.type} style={{ padding: '0.875rem', background: 'rgba(44, 48, 46, 0.02)', borderRadius: 2, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{b.type}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{b.balance}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>days remaining</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* My recent leaves */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <CardHeading>My Leave Requests</CardHeading>
            <Link to="/leaves" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontStyle: 'italic' }}>View all →</Link>
          </div>
          {myLeaves.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>No leave requests yet</div>
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
              <Link to="/tasks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', fontStyle: 'italic' }}>View all →</Link>
            </div>
            {myTasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>No open tasks</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myTasks.map((t: Record<string, unknown>) => (
                  <div key={t.id as number} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor[t.priority as string] ?? 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{t.title as string}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Due {new Date(t.due_date as string).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(t.id as number)}
                      title="Mark as completed"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Check size={16} strokeWidth={1.8} />
                    </button>
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
  if (!items.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>No announcements yet</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(a => (
        <div key={a.id as number} style={{ padding: '0.625rem 0.75rem', background: 'rgba(44, 48, 46, 0.02)', borderRadius: 2, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{a.title as string}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>by {a.author as string} · {new Date(a.created_at as string).toLocaleDateString()}</p>
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
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
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
