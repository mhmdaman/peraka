import { useEffect, useState } from 'react'
import { Plus, Check, X, Calendar as CalendarIcon, BriefcaseMedical } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Leave {
  id: number
  employee_id: number
  start_date: string
  end_date: string
  type: string
  reason: string
  status: string
  employee_name?: string
}

interface Balance {
  type: string
  balance: number
}

export default function Leaves() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [leavesRes, balRes] = await Promise.all([
        api.get('/leaves'),
        user?.role !== 'admin' ? api.get(`/leaves/balance/${user?.id}`) : Promise.resolve({ data: { data: [] } })
      ])
      setLeaves(leavesRes.data.data)
      if (user?.role !== 'admin') {
        setBalances(balRes.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.put(`/leaves/${id}/status`, { status })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
      default: return { bg: 'var(--bg-surface)', text: 'var(--text-secondary)' }
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Track and manage employee time off</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      {user?.role !== 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {balances.map(b => (
            <div key={b.type} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {b.type === 'sick' ? <BriefcaseMedical size={24} /> : <CalendarIcon size={24} />}
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{b.type} Leave</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{b.balance} days</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Leave Requests</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leaves...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {user?.role === 'admin' && <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>}
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leave Type</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dates</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reason</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  {user?.role === 'admin' && <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>{leave.employee_name}</td>
                    )}
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{leave.type}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 999, 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: getStatusColor(leave.status).bg,
                        color: getStatusColor(leave.status).text
                      }}>
                        {leave.status}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {leave.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleStatusUpdate(leave.id, 'approved')} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Approve">
                              <Check size={16} />
                            </button>
                            <button onClick={() => handleStatusUpdate(leave.id, 'rejected')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reject">
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
