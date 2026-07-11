import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays,
  CheckSquare, Megaphone, MessageSquare,
  Settings, Zap, Building2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Each item can restrict to specific roles with `roles: [...]`
// If no `roles` key → visible to all
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
    gap: '0.625rem',
    padding: collapsed ? '0.55rem' : '0.55rem 0.75rem',
    borderRadius: 7,
    textDecoration: 'none',
    fontSize: '0.8125rem',
    fontWeight: isActive ? 600 : 400,
    justifyContent: collapsed ? 'center' : 'flex-start',
    transition: 'color 0.12s, background 0.12s',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
  })

  return (
    <aside style={{
      width: collapsed ? 60 : 220,
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
        padding: collapsed ? '1.125rem 0' : '1.125rem 1.125rem',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        borderBottom: '1px solid var(--border)',
        height: 60,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={15} color="#0a0a0a" fill="#0a0a0a" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>Peraka</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'manager' ? 'Manager Portal' : 'Employee Portal'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {visible.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} style={({ isActive }) => linkStyle(isActive)}>
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <NavLink to="/settings" style={({ isActive }) => linkStyle(isActive)}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  )
}
