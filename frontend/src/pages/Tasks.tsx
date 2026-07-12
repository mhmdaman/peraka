import { useEffect, useState } from 'react'
import { Plus, CheckSquare, Clock, AlignLeft, Calendar, X, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Task {
  id: number
  title: string
  description: string
  assigned_to: number
  assigned_by: number
  due_date: string
  status: string
  priority: string
  created_at: string
  assigned_to_name?: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
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

export default function Tasks() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: new Date().toISOString().slice(0, 10)
  })

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await api.get('/tasks')
      setTasks(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees')
      setEmployees(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchTasks()
    if (canManage) fetchEmployees()
  }, [canManage])

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status })
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this completed task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.assigned_to) { setError('Assignee is required'); return }
    setSubmitting(true)
    try {
      await api.post('/tasks', form)
      setShowAddModal(false)
      setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: new Date().toISOString().slice(0, 10) })
      fetchTasks()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--danger)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--text-muted)'
      case 'urgent': return 'var(--danger)'
      default: return 'var(--text-muted)'
    }
  }

  const renderTaskColumn = (status: string, title: string) => {
    const columnTasks = tasks.filter(t => t.status === status)
    
    return (
      <div style={{ flex: 1, minWidth: 300, background: 'rgba(44, 48, 46, 0.02)', borderRadius: 2, padding: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '0.125rem 0.5rem', borderRadius: 999, border: '1px solid var(--border)' }}>{columnTasks.length}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {columnTasks.map(task => (
            <div key={task.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: getPriorityColor(task.priority) }} title={`Priority: ${task.priority}`} />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{task.title}</h4>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {task.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                  <Calendar size={12} />
                  {new Date(task.due_date).toLocaleDateString()}
                </div>
                {canManage && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    To: {task.assigned_to_name}
                  </div>
                )}
              </div>

              {/* Status transition buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {status !== 'pending' && <button onClick={() => handleStatusUpdate(task.id, 'pending')} className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: 2 }}>To Pending</button>}
                {status !== 'in-progress' && <button onClick={() => handleStatusUpdate(task.id, 'in-progress')} className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: 2 }}>To Progress</button>}
                {status !== 'completed' && <button onClick={() => handleStatusUpdate(task.id, 'completed')} className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: 2 }}>To Complete</button>}
                {status === 'completed' && user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: 2, border: '1px solid rgba(252,165,165,0.3)', background: 'rgba(252,165,165,0.06)', color: '#fca5a5', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(252,165,165,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(252,165,165,0.06)' }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: 2 }}>
              No tasks
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage projects and individual assignments</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} strokeWidth={1.8} /> New Task
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {renderTaskColumn('pending', 'To Do')}
          {renderTaskColumn('in-progress', 'In Progress')}
          {renderTaskColumn('completed', 'Completed')}
        </div>
      )}

      {/* ── Add Task Modal ── */}
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
            width: '100%', maxWidth: 500,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(44, 48, 46, 0.15)',
            animation: 'inkFade 0.3s ease',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Assign Task</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 2, lineHeight: 0 }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(122,59,59,0.06)', border: '1px solid rgba(122,59,59,0.12)', borderRadius: 2, color: 'var(--danger)', fontSize: '0.8125rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={labelStyle}>Task Title *</label>
                <input required name="title" value={form.title} onChange={handleChange} style={inputStyle} placeholder="e.g. Q3 Report" />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Task details..." />
              </div>

              <div>
                <label style={labelStyle}>Assign To *</label>
                <select required name="assigned_to" value={form.assigned_to} onChange={handleChange} style={inputStyle}>
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Priority *</label>
                  <select required name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date *</label>
                  <input required type="date" name="due_date" value={form.due_date} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Assigning…' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
