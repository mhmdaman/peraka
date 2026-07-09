import { useEffect, useState } from 'react'
import { Plus, CheckSquare, Clock, AlignLeft, Calendar } from 'lucide-react'
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

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.put(`/tasks/${id}/status`, { status })
      fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return 'var(--text-muted)'
    }
  }

  const renderTaskColumn = (status: string, title: string) => {
    const columnTasks = tasks.filter(t => t.status === status)
    
    return (
      <div style={{ flex: 1, minWidth: 300, background: 'var(--bg-surface)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '0.125rem 0.5rem', borderRadius: 999 }}>{columnTasks.length}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {columnTasks.map(task => (
            <div key={task.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'grab' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <Calendar size={12} />
                  {new Date(task.due_date).toLocaleDateString()}
                </div>
                {user?.role === 'admin' && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    To: {task.assigned_to_name}
                  </div>
                )}
              </div>

              {/* Minimal status transition buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {status !== 'pending' && <button onClick={() => handleStatusUpdate(task.id, 'pending')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}>To Pending</button>}
                {status !== 'in-progress' && <button onClick={() => handleStatusUpdate(task.id, 'in-progress')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}>To Progress</button>}
                {status !== 'completed' && <button onClick={() => handleStatusUpdate(task.id, 'completed')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer' }}>To Complete</button>}
              </div>
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', border: '2px dashed var(--border)', borderRadius: '0.5rem' }}>
              No tasks
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage projects and individual assignments</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {renderTaskColumn('pending', 'To Do')}
          {renderTaskColumn('in-progress', 'In Progress')}
          {renderTaskColumn('completed', 'Completed')}
        </div>
      )}
    </div>
  )
}
