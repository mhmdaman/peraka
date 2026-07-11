import { useEffect, useState } from 'react'
import { Plus, Search, Building2, X } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Department {
  id: number
  name: string
  description: string
  manager_name: string | null
  employee_count: number
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

export default function Departments() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({ name: '', description: '', manager_id: '' })
  const [managers, setManagers] = useState<{id: number, first_name: string, last_name: string}[]>([])
  const [error, setError] = useState('')

  const fetchDeps = async () => {
    try {
      setLoading(true)
      const res = await api.get('/departments')
      setDepartments(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeps()
    if (canManage) {
      api.get('/employees').then(r => {
        const mgrs = r.data.data.filter((e: any) => e.role === 'manager' || e.role === 'admin')
        setManagers(mgrs)
      }).catch(console.error)
    }
  }, [canManage])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/departments', form)
      setShowModal(false)
      setForm({ name: '', description: '', manager_id: '' })
      fetchDeps()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create department')
    }
  }

  const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage company departments</p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={15} strokeWidth={1.8} /> Add Department
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={15} strokeWidth={1.8} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Manager</th>
                  <th>Employees</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="ink-ripple">
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                      {d.name}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>{d.description || '-'}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>{d.manager_name || 'Unassigned'}</td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'rgba(44, 48, 46, 0.04)', border: '1px solid var(--border)', padding: '0.15rem 0.6rem', borderRadius: 2, fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                        {d.employee_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44, 48, 46, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', backgroundImage: 'var(--paper-texture)', borderRadius: 3, width: '100%', maxWidth: 450, overflow: 'hidden', boxShadow: '0 24px 48px rgba(44, 48, 46, 0.15)', animation: 'inkFade 0.3s ease' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Add Department</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} style={{ padding: '1.5rem' }}>
              {error && <div style={{ background: 'rgba(122,59,59,0.06)', border: '1px solid rgba(122,59,59,0.12)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 2, fontSize: '0.8125rem', marginBottom: '1.25rem' }}>{error}</div>}
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Department Name</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Engineering" />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional description" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Manager</label>
                <select style={inputStyle} value={form.manager_id} onChange={e => setForm({...form, manager_id: e.target.value})}>
                  <option value="">-- None --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
