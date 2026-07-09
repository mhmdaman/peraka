import { useEffect, useState } from 'react'
import { FileText, Download, PlayCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Payslip {
  id: number
  employee_id: number
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  created_at: string
  employee_name?: string
}

export default function Payroll() {
  const { user } = useAuth()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchPayroll = async () => {
    try {
      setLoading(true)
      const res = await api.get('/payroll')
      setPayslips(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayroll()
  }, [])

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true)
      const date = new Date()
      // Generate for last month
      let month = date.getMonth()
      let year = date.getFullYear()
      if (month === 0) { month = 12; year -= 1 }
      await api.post('/payroll/generate', { month, year })
      fetchPayroll()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
  }

  const getMonthName = (monthNumber: number) => {
    const date = new Date()
    date.setMonth(monthNumber - 1)
    return date.toLocaleString('en-US', { month: 'long' })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">View and manage salary slips and payroll history</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={handleGeneratePayroll} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: generating ? 0.7 : 1 }}>
            <PlayCircle size={16} /> {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Payslip History</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payroll data...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {user?.role === 'admin' && <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>}
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Basic Salary</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deductions</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Salary</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(slip => (
                  <tr key={slip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>{slip.employee_name}</td>
                    )}
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="var(--text-muted)" />
                        {getMonthName(slip.month)} {slip.year}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatCurrency(slip.basic_salary)}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <span style={{ color: '#ef4444' }}>-{formatCurrency(slip.deductions)}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(slip.net_salary)}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 999, 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: slip.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: slip.status === 'paid' ? '#10b981' : '#f59e0b'
                      }}>
                        {slip.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} title="Download PDF">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === 'admin' ? 7 : 6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No payroll records found.
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
