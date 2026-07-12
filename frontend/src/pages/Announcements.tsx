import { useEffect, useState } from 'react'
import { Plus, Megaphone, Trash2, Pencil, X } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Announcement {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
  created_by_name: string
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

export default function Announcements() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [error, setError] = useState('')

  // Edit modal
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await api.get('/announcements')
      setAnnouncements(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}`)
      fetchAnnouncements()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/announcements', form)
      setShowModal(false)
      setForm({ title: '', content: '' })
      fetchAnnouncements()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create announcement')
    }
  }

  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    setEditForm({ title: a.title, content: a.content })
    setEditError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditError('')
    setEditSubmitting(true)
    try {
      await api.put(`/announcements/${editTarget.id}`, editForm)
      setEditTarget(null)
      fetchAnnouncements()
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update announcement')
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Stay up to date with company news</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : announcements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Megaphone size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No announcements to show.</p>
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="card" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Megaphone size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{announcement.title}</h3>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => openEdit(announcement)}
                        title="Edit"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 4, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 4, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fca5a5')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{announcement.created_by_name}</span>
                  <span>•</span>
                  <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {announcement.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Edit Announcement Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', backgroundImage: 'var(--paper-texture)', borderRadius: 14, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Edit Announcement</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update the title or content</p>
              </div>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(252,165,165,0.08)', border: '1px solid rgba(252,165,165,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: '0.8125rem' }}>{editError}</div>}
              <div>
                <label style={labelStyle}>Title</label>
                <input required style={inputStyle} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Content</label>
                <textarea required style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setEditTarget(null)} style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={editSubmitting} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: editSubmitting ? 'not-allowed' : 'pointer', background: 'var(--text-primary)', color: '#0a0a0a', border: 'none', opacity: editSubmitting ? 0.6 : 1 }}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Announcement Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 16, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>New Announcement</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} style={{ padding: '1.5rem' }}>
              {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1.25rem' }}>{error}</div>}
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Title</label>
                <input required style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Announcement Title" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Content</label>
                <textarea required style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Type your announcement here..." />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500 }}>Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
