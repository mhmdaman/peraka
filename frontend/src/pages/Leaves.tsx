import { useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Leave {
  id: number
  employee_name?: string
  job_title?: string
  type: string
  start_date: string
  end_date: string
  reason: string
  days: number
  status: string
  manager_comment?: string
  created_at: string
}

interface Balance { type: string; balance: number }

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  pending_manager: { label: 'Awaiting Manager', color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  pending_admin: { label: 'Awaiting HR', color: '#93c5fd', bg: 'rgba(147,197,253,0.1)' },
  approved: { label: 'Approved', color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  rejected: { label: 'Rejected', color: '#fca5a5', bg: 'rgba(252,165,165,0.1)' },
}

const StatusBadge = ({ status }: { status: string }) => {
  const s = statusLabel[status] ?? { label: status, color: '#a3a3a3', bg: 'rgba(163,163,163,0.1)' }
  return (
    <span style={{ padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.3rem', fontSize: '0.72rem',
  fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const today = new Date().toISOString().split('T')[0]
const defaultForm = { type: 'sick', start_date: '', end_date: '', reason: '' }

export default function Leaves() {
  const { user } = useAuth()
  const role = user?.role ?? 'employee'

  const [leaves, setLeaves] = useState<Leave[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [acting, setActing] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [leavesRes, balRes] = await Promise.all([
        api.get('/leaves'),
        role === 'employee'
          ? api.get(`/leaves/balances/${user?.id}`)
          : Promise.resolve({ data: { data: [] } })
      ])
      setLeaves(leavesRes.data.data)
      setBalances(balRes.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.start_date || !form.end_date) { setError('Please select dates'); return }
    if (form.start_date < today) { setError('Start date cannot be in the past'); return }
    if (new Date(form.end_date) < new Date(form.start_date)) { setError('End date must be after start date'); return }
    setSubmitting(true)
    try {
      await api.post('/leaves', form)
      setShowModal(false)
      setForm(defaultForm)
      fetchData()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to apply')
    } finally { setSubmitting(false) }
  }

  const managerAction = async (id: number, action: 'forward' | 'reject') => {
    setActing(id)
    try { await api.put(`/leaves/${id}/manager-review`, { action }); fetchData() }
    catch (e) { console.error(e) }
    finally { setActing(null) }
  }

  const adminAction = async (id: number, action: 'approve' | 'reject') => {
    setActing(id)
    try { await api.put(`/leaves/${id}/admin-review`, { action }); fetchData() }
    catch (e) { console.error(e) }
    finally { setActing(null) }
  }

  const canAction = (leave: Leave) => {
    if (role === 'manager') return leave.status === 'pending_manager'
    if (role === 'admin') return leave.status === 'pending_admin'
    return false
  }

  const pageSubtitle =
    role === 'admin' ? 'HR final approval — leaves forwarded by managers' :
      role === 'manager' ? 'Review employee leave requests and forward to HR' :
        'Apply for leave and track your requests'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>
        {role === 'employee' && (
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: 'var(--text-primary)', color: 'white', border: 'none' }}
          >
            <Plus size={15} /> Apply for Leave
          </button>
        )}
      </div>

      {/* Leave balances (employee only) */}
      {role === 'employee' && balances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
          {balances.map(b => (
            <div key={b.type} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{b.type}</div>
              <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{b.balance}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>days left</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {role === 'admin' && 'Leaves Awaiting HR Approval'}
            {role === 'manager' && 'Employees\' Leave Requests'}
            {role === 'employee' && 'My Leave History'}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {(role !== 'employee') && <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</th>}
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dates</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Days</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason</th>
                  <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  {(role === 'manager' || role === 'admin') && <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {role !== 'employee' && (
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{leave.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.job_title}</div>
                      </td>
                    )}
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{leave.type}</td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(leave.start_date).toLocaleDateString()} – {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{leave.days}d</td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leave.reason}</td>
                    <td style={{ padding: '0.8rem 1rem' }}><StatusBadge status={leave.status} /></td>
                    {(role === 'manager' || role === 'admin') && (
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                        {canAction(leave) && (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {role === 'manager' ? (
                              <>
                                <button disabled={acting === leave.id} onClick={() => managerAction(leave.id, 'forward')}
                                  style={{ padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(147,197,253,0.12)', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Check size={12} /> Forward
                                </button>
                                <button disabled={acting === leave.id} onClick={() => managerAction(leave.id, 'reject')}
                                  style={{ padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(252,165,165,0.1)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <X size={12} /> Reject
                                </button>
                              </>
                            ) : (
                              <>
                                <button disabled={acting === leave.id} onClick={() => adminAction(leave.id, 'approve')}
                                  style={{ padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(110,231,183,0.12)', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Check size={12} /> Approve
                                </button>
                                <button disabled={acting === leave.id} onClick={() => adminAction(leave.id, 'reject')}
                                  style={{ padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(252,165,165,0.1)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <X size={12} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Modal (employee only) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Apply for Leave</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Your request will go to your manager first</p>
              </div>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApply} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label style={labelStyle}>Leave Type</label>
                <select name="type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {['sick', 'casual', 'paid', 'unpaid'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input required type="date" value={form.start_date} min={today} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input required type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inputStyle} min={form.start_date} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Reason</label>
                <textarea required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Brief reason for your leave…" />
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => { setShowModal(false); setError('') }}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ padding: '0.5rem 1.125rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', background: 'var(--text-primary)', color: '#0a0a0a', border: 'none', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
