import { useState } from 'react'
import { Bell, Search, Menu, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'
import { StatusBadge } from './Badge'
import { useNavigate } from 'react-router-dom'

interface TopbarProps {
  onToggleSidebar: () => void
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const fullName = `${user?.first_name} ${user?.last_name}`

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      height: 64,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.25rem',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Menu toggle */}
      <button onClick={onToggleSidebar} className="btn btn-ghost" style={{ padding: '0.375rem' }}>
        <Menu size={20} />
      </button>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Search employees, tasks..."
          style={{ paddingLeft: '2.25rem', height: 38, fontSize: '0.8125rem' }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Notifications */}
        <button className="btn btn-ghost" style={{ padding: '0.375rem', position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444', border: '2px solid var(--bg-surface)',
          }} />
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.375rem 0.75rem 0.375rem 0.375rem',
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Avatar name={fullName} src={user?.avatar} size="sm" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{fullName}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, minWidth: 200, padding: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
              animation: 'slideUp 0.15s ease',
            }}>
              <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                <div style={{ marginTop: '0.375rem' }}><StatusBadge value={user?.role ?? ''} /></div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', gap: '0.5rem', padding: '0.5rem 0.75rem' }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
