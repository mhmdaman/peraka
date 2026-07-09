import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, MoreVertical, X, Eye, EyeOff } from 'lucide-react'
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

interface Role { id: number; name: string }
interface Department { id: number; name: string }

const defaultForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  job_title: '',
  department_id: '',
  role_id: '',
  date_of_joining: new Date().toISOString().slice(0, 10),
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.875rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export default function Employees() {
  const [employees, setEmployees]     = useState<Employee[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm]               = useState(defaultForm)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [roles, setRoles]             = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [showPwd, setShowPwd]         = useState(false)

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
    api.get('/departments').then(r => setDepartments(r.data.data || [])).catch(() => {})
    api.get('/auth/roles').then(r => setRoles(r.data.data || [])).catch(() => {
      setRoles([
        { id: 1, name: 'admin' },
        { id: 2, name: 'manager' },
        { id: 3, name: 'employee' },
      ])
    })
  }, [])

  const filteredEmployees = employees.filter(emp =>
    (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const closeModal = () => {
    setShowAddModal(false)
    setForm(defaultForm)
    setError('')
    setShowPwd(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.role_id)          { setError('Role is required'); return }
    if (!form.password.trim())  { setError('Password is required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setSubmitting(true)
    try {
      await api.post('/employees', form)
      closeModal()
      fetchEmployees()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', border: 'none' }}
        >
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Search bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            />
          </div>
          <button
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: 8, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Loading...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {['Employee', 'Job Title', 'Department', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: h === '' ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden' }}>
                          {emp.avatar
                            ? <img src={emp.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : `${emp.first_name[0]}${emp.last_name[0]}`}
                        </div>
                        <div>
                          <Link to={`/employees/${emp.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                            {emp.first_name} {emp.last_name}
                          </Link>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{emp.job_title}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{emp.department_name || '—'}</td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.02em',
                        background: emp.status === 'active' ? 'rgba(110,231,183,0.1)' : 'rgba(163,163,163,0.1)',
                        color: emp.status === 'active' ? '#6ee7b7' : '#a3a3a3',
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6 }}>
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Employee Modal ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            width: '100%', maxWidth: 560,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add New Employee</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Set a password the employee will use to log in
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 6, lineHeight: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleAdd} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Error banner */}
              {error && (
                <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input required name="first_name" value={form.first_name} onChange={handleChange} style={inputStyle} placeholder="John" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input required name="last_name" value={form.last_name} onChange={handleChange} style={inputStyle} placeholder="Doe" />
                </div>
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} placeholder="john@company.com" />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="9876543210" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    style={{ ...inputStyle, paddingRight: '2.5rem' }}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0, padding: 0 }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Job title */}
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input required name="job_title" value={form.job_title} onChange={handleChange} style={inputStyle} placeholder="Software Engineer" />
              </div>

              {/* Role + Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select required name="role_id" value={form.role_id} onChange={handleChange} style={inputStyle}>
                    <option value="">Select role…</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select name="department_id" value={form.department_id} onChange={handleChange} style={inputStyle}>
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date of joining */}
              <div>
                <label style={labelStyle}>Date of Joining *</label>
                <input required type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} style={inputStyle} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', background: 'var(--text-primary)', color: '#0a0a0a', border: 'none', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Adding…' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
