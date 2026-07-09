import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react'
import api from '../lib/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  job_title: string
  department_name: string
  status: string
  avatar: string | null
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get('/employees')
      setEmployees(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter(emp =>
    (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members and their information</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', margin: 0 }}
            />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} /> Filters
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Job Title</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                          {emp.avatar ? <img src={emp.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : `${emp.first_name[0]}${emp.last_name[0]}`}
                        </div>
                        <div>
                          <Link to={`/employees/${emp.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{emp.first_name} {emp.last_name}</Link>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>{emp.job_title}</td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{emp.department_name || 'N/A'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 999, 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: emp.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: emp.status === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No employees found.
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
