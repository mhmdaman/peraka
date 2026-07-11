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
      case 'present': return { bg: 'rgba(74,109,92,0.1)', text: 'var(--success)' }
      case 'late': return { bg: 'rgba(139,122,62,0.1)', text: 'var(--warning)' }
      case 'absent': return { bg: 'rgba(122,59,59,0.1)', text: 'var(--danger)' }
      case 'half-day': return { bg: 'rgba(62,92,122,0.1)', text: 'var(--info)' }
      default: return { bg: 'rgba(138,141,137,0.1)', text: 'var(--text-muted)' }
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
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(44, 48, 46, 0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Clock size={32} strokeWidth={1.5} color="var(--text-primary)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontStyle: 'italic', fontSize: '0.8125rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {!todayRecord?.check_in ? (
            <button className="btn btn-primary" onClick={handleCheckIn} style={{ width: '100%', padding: '0.875rem', justifyContent: 'center', fontSize: '0.9rem' }}>
              <LogIn size={18} strokeWidth={1.8} /> Check In
            </button>
          ) : !todayRecord?.check_out ? (
            <div style={{ width: '100%' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem', fontStyle: 'italic' }}>Checked in at {todayRecord.check_in}</p>
              <button className="btn btn-danger" onClick={handleCheckOut} style={{ width: '100%', padding: '0.875rem', justifyContent: 'center', fontSize: '0.9rem' }}>
                <LogOut size={18} strokeWidth={1.8} /> Check Out
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', justifyContent: 'center', fontWeight: 500, fontSize: '0.875rem' }}>
                <CheckCircle size={18} strokeWidth={1.8} /> Shift Completed
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontStyle: 'italic' }}>Working hours: {todayRecord.working_hours}h</p>
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            Current Month Overview
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(44, 48, 46, 0.02)', borderRadius: 2, border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 2, background: 'rgba(74,109,92,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20} strokeWidth={1.8} /></div>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>Present Days</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, marginTop: '0.2rem' }}>18</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(44, 48, 46, 0.02)', borderRadius: 2, border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 2, background: 'rgba(139,122,62,0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20} strokeWidth={1.8} /></div>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>Late Arrivals</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, marginTop: '0.2rem' }}>2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Attendance Logs</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading attendance history...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {user?.role === 'admin' && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(record => (
                  <tr key={record.id} className="ink-ripple">
                    {user?.role === 'admin' && (
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>{record.employee_name}</td>
                    )}
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{new Date(record.date).toLocaleDateString()}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>{record.check_in || '-'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>{record.check_out || '-'}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>{record.working_hours ? `${record.working_hours}h` : '-'}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: 2, 
                        fontSize: '0.68rem', 
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
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
                    <td colSpan={user?.role === 'admin' ? 6 : 5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
