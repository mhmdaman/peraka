import { useEffect, useState } from 'react'
import { Plus, Megaphone, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Announcement {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
  author: string
}

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Stay up to date with company news</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(announcement.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{announcement.author}</span>
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
    </div>
  )
}
