import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, MoreVertical, X, Eye, EyeOff, Pencil } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  job_title: string
  department_name: string
  status: string
  avatar: string | null
  manager?: { first_name: string, last_name: string } | null
}

interface Role { id: number; name: string }
interface Department { id: number; name: string }
interface Manager { id: number; first_name: string; last_name: string }

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
  borderRadius: 2,
  border: '1px solid var(--border)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.3s, box-shadow 0.3s',
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export default function Employees() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [employees, setEmployees]     = useState<Employee[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm]               = useState(defaultForm)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [roles, setRoles]             = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers]       = useState<Manager[]>([])
  const [showPwd, setShowPwd]         = useState(false)

  // Edit employee
  const [editTarget, setEditTarget]   = useState<(Employee & { role_id?: string; department_id?: string; phone?: string; date_of_joining?: string }) | null>(null)
  const [editForm, setEditForm]       = useState({ first_name: '', last_name: '', email: '', job_title: '', phone: '', role_id: '', department_id: '', date_of_joining: '' })
  const [editError, setEditError]     = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [openMenuId, setOpenMenuId]   = useState<number | null>(null)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await api.get('/employees')
      setEmployees(res.data.data)
      
      const mgrs = res.data.data.filter((e: any) => e.role_name === 'manager' || e.role_name === 'admin' || e.job_title?.toLowerCase().includes('manager'))
      setManagers(mgrs)
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

  const openEdit = async (emp: Employee) => {
    setOpenMenuId(null)
    try {
      const res = await api.get(`/employees/${emp.id}`)
      const e = res.data.data
      setEditForm({
        first_name: e.first_name ?? '',
        last_name: e.last_name ?? '',
        email: e.email ?? '',
        job_title: e.job_title ?? '',
        phone: e.phone ?? '',
        role_id: e.role_id?.toString() ?? '',
        department_id: e.department_id?.toString() ?? '',
        date_of_joining: e.date_of_joining ? e.date_of_joining.slice(0, 10) : '',
      })
    } catch {
      setEditForm({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, job_title: emp.job_title, phone: '', role_id: '', department_id: '', date_of_joining: '' })
    }
    setEditTarget(emp as any)
    setEditError('')
  }

  const closeEdit = () => { setEditTarget(null); setEditError('') }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditError('')
    setEditSubmitting(true)
    try {
      await api.put(`/employees/${editTarget.id}`, editForm)
      closeEdit()
      fetchEmployees()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setEditError(msg || 'Failed to update employee')
    } finally {
      setEditSubmitting(false)
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
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={15} strokeWidth={1.8} /> Add Employee
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0 }}>
        {/* Search bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={15} strokeWidth={1.8} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            />
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} strokeWidth={1.8} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              Loading...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Employee', 'Job Title', 'Department', 'Manager', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="ink-ripple">
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(44,48,46,0.06)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0, overflow: 'hidden', fontFamily: 'var(--font-display)' }}>
                          {emp.avatar
                            ? <img src={emp.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : `${emp.first_name[0]}${emp.last_name[0]}`}
                        </div>
                        <div>
                          <Link to={`/employees/${emp.id}`} style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                            {emp.first_name} {emp.last_name}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{emp.job_title}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{emp.department_name || '—'}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem', borderRadius: 2, fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                        background: emp.status === 'active' ? 'rgba(74,109,92,0.08)' : 'rgba(138,141,137,0.08)',
                        color: emp.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 2 }}
                      >
                        <MoreVertical size={15} strokeWidth={1.8} />
                      </button>
                      {openMenuId === emp.id && (
                        <div style={{ position: 'absolute', right: '1rem', top: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                          <button
                            onClick={() => openEdit(emp)}
                            style={{ width: '100%', padding: '0.6rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <Pencil size={13} /> Edit Employee
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Edit Employee Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44, 48, 46, 0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', backgroundImage: 'var(--paper-texture)', borderRadius: 3, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(44, 48, 46, 0.15)', animation: 'inkFade 0.3s ease' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Edit Employee</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>{editTarget.first_name} {editTarget.last_name}</p>
              </div>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', lineHeight: 0 }}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
            <form onSubmit={handleEdit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(122,59,59,0.06)', border: '1px solid rgba(122,59,59,0.12)', borderRadius: 2, color: 'var(--danger)', fontSize: '0.8125rem' }}>{editError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input required name="first_name" value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input required name="last_name" value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Job Title *</label>
                <input required value={editForm.job_title} onChange={e => setEditForm(f => ({ ...f, job_title: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={editForm.role_id} onChange={e => setEditForm(f => ({ ...f, role_id: e.target.value }))} style={inputStyle}>
                    <option value="">Select role…</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select value={editForm.department_id} onChange={e => setEditForm(f => ({ ...f, department_id: e.target.value }))} style={inputStyle}>
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date of Joining</label>
                <input type="date" value={editForm.date_of_joining} onChange={e => setEditForm(f => ({ ...f, date_of_joining: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={closeEdit} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="btn btn-primary" style={{ opacity: editSubmitting ? 0.6 : 1 }}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44, 48, 46, 0.3)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            backgroundImage: 'var(--paper-texture)',
            borderRadius: 3,
            width: '100%', maxWidth: 560,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(44, 48, 46, 0.15)',
            animation: 'inkFade 0.3s ease',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add New Employee</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                  Create an account and assign a manager
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 2, lineHeight: 0 }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleAdd} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Error banner */}
              {error && (
                <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(122,59,59,0.06)', border: '1px solid rgba(122,59,59,0.12)', borderRadius: 2, color: 'var(--danger)', fontSize: '0.8125rem' }}>
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
                    {showPwd ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
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
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ opacity: submitting ? 0.6 : 1 }}>
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
