import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays,
  CheckSquare, Megaphone, MessageSquare,
  Settings, Building2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',      exact: true },
  { to: '/departments',   icon: Building2,       label: 'Departments',    roles: ['admin', 'manager'] },
  { to: '/employees',     icon: Users,           label: 'Employees',      roles: ['admin', 'manager'] },
  { to: '/leaves',        icon: CalendarDays,    label: 'Leaves' },
  { to: '/tasks',         icon: CheckSquare,     label: 'Tasks' },
  { to: '/announcements', icon: Megaphone,       label: 'Announcements' },
  { to: '/chat',          icon: MessageSquare,   label: 'Chat' },
]

interface SidebarProps { collapsed: boolean }

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user } = useAuth()

  const visible = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role ?? '')
  )

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: collapsed ? '0.625rem' : '0.625rem 0.875rem',
    borderRadius: 2,
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: isActive ? 600 : 400,
    justifyContent: collapsed ? 'center' : 'flex-start',
    transition: 'all 0.3s ease',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    background: isActive ? 'rgba(44, 48, 46, 0.06)' : 'transparent',
    letterSpacing: '0.01em',
    position: 'relative' as const,
  })

  return (
    <aside style={{
      width: collapsed ? 60 : 230,
      transition: 'width 0.3s ease',
      background: 'var(--bg-surface)',
      backgroundImage: 'var(--paper-texture)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(60, 56, 48, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '1.25rem 0' : '1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderBottom: '1px solid rgba(60, 56, 48, 0.08)',
        height: 64,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingRight: '0.5rem' }}>
            <img 
              src="/E9E90172-BF75-4D65-B3DE-C51789596691_4_5005_c.jpeg" 
              alt="Peraka Logo" 
              style={{ height: 36, objectFit: 'contain', alignSelf: 'flex-start', mixBlendMode: 'multiply' }} 
            />
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.15rem' }}>
              {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'manager' ? 'Manager Portal' : 'Employee Portal'}
            </div>
          </div>
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(44,48,46,0.2)',
          }}>
            <span style={{ color: 'var(--bg-primary)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>P</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} style={({ isActive }) => linkStyle(isActive)}>
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Decorative ink brush stroke divider */}
      <div style={{ padding: '0 0.625rem', margin: '0.25rem 0' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(60,56,48,0.12), transparent)' }} />
      </div>

      {/* Settings */}
      <div style={{ padding: '0.625rem' }}>
        <NavLink to="/settings" style={({ isActive }) => linkStyle(isActive)}>
          <Settings size={16} strokeWidth={1.8} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
