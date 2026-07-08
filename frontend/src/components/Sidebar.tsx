import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Clock, CalendarDays,
  CreditCard, CheckSquare, Megaphone, MessageSquare,
  Settings, ChevronRight, Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'manager'] },
  { to: '/attendance', icon: Clock, label: 'Attendance' },
  { to: '/leaves', icon: CalendarDays, label: 'Leaves' },
  { to: '/payroll', icon: CreditCard, label: 'Payroll', roles: ['admin', 'manager'] },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth()

  const visible = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role ?? '')
  )

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      transition: 'width 0.25s ease',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderBottom: '1px solid var(--border)',
        height: 64,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}>
          <Zap size={18} color="white" fill="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Peraka</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>EMS Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: collapsed ? '0.6rem' : '0.6rem 0.875rem',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s',
              color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, background: '#6366f1', borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
                {!collapsed && isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: collapsed ? '0.6rem' : '0.6rem 0.875rem',
            borderRadius: 8, textDecoration: 'none', fontSize: '0.875rem',
            fontWeight: 500, justifyContent: collapsed ? 'center' : 'flex-start',
            color: isActive ? '#a5b4fc' : 'var(--text-secondary)',
            background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
            transition: 'all 0.15s',
          })}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
