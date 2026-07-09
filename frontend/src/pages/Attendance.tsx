import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface AttendanceRecord {
  id: number
  employee_id: number
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  working_hours: number | null
  employee_name?: string
}

export default function Attendance() {
  const { user } = useAuth()
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance')
      ])
      setTodayRecord(todayRes.data.data)
      setHistory(historyRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/check-in')
      fetchAttendance()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/check-out')
      fetchAttendance()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
      case 'late': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
      case 'absent': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
      case 'half-day': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }
      default: return { bg: 'var(--bg-surface)', text: 'var(--text-secondary)' }
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your daily attendance and work hours</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Check In / Out Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', padding: '2.5rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Clock size={40} color="#6366f1" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {!todayRecord?.check_in ? (
            <button className="btn-primary" onClick={handleCheckIn} style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <LogIn size={20} /> Check In
            </button>
          ) : !todayRecord?.check_out ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Checked in at {todayRecord.check_in}</p>
              <button onClick={handleCheckOut} style={{ width: '100%', padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                <LogOut size={20} /> Check Out
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem', justifyContent: 'center' }}>
                <CheckCircle size={20} /> Shift Completed
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Working hours: {todayRecord.working_hours}h</p>
            </div>
          )}
        </div>

        {/* Today's Stats (For Managers this could be team overview, but for employee it's simple stats) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Current Month Overview</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Minimal static mock of stats for now since we don't have a specific endpoint response structure built out here */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Present Days</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>18</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20} /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Late Arrivals</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Attendance Logs</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance history...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {user?.role === 'admin' && <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>}
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check In</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Check Out</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hours</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>{record.employee_name}</td>
                    )}
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{record.check_in || '-'}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{record.check_out || '-'}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{record.working_hours ? `${record.working_hours}h` : '-'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 999, 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: getStatusColor(record.status).bg,
                        color: getStatusColor(record.status).text
                      }}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 6 : 5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance records found.
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
