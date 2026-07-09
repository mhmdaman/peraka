import { useState } from 'react'
import { User, Lock, Bell, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function Settings() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form states
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.put(`/employees/${user?.id}`, {
        first_name: user?.first_name,
        last_name: user?.last_name,
        phone,
        address,
        job_title: user?.job_title,
        department_id: user?.department_id,
        role_id: user?.role_id,
        salary_base: user?.salary_base,
        status: user?.status
      })
      setMessage('Profile updated successfully')
    } catch (err) {
      console.error(err)
      setMessage('Failed to update profile')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    // Mock password update
    setMessage('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setTimeout(() => setMessage(''), 3000)
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Profile Information</h3>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="input-field" value={user?.first_name} disabled style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="input-field" value={user?.last_name} disabled style={{ opacity: 0.7 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="input-field" value={user?.email} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="input-field" value={address} onChange={e => setAddress(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )
      case 'security':
        return (
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Security Settings</h3>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )
      case 'preferences':
        return (
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>App Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Dark Mode</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Toggle dark mode appearance</p>
                </div>
                <div style={{ width: 44, height: 24, background: 'var(--accent)', borderRadius: 999, position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', right: 2, top: 2 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Email Notifications</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>Receive daily summary emails</p>
                </div>
                <div style={{ width: 44, height: 24, background: 'var(--border)', borderRadius: 999, position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', left: 2, top: 2 }} />
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and application preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: activeTab === 'profile' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'profile' ? 600 : 500
            }}
          >
            <User size={18} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: activeTab === 'security' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'security' ? 600 : 500
            }}
          >
            <Lock size={18} /> Security
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: activeTab === 'preferences' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'preferences' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'preferences' ? 600 : 500
            }}
          >
            <Bell size={18} /> Preferences
          </button>

          <div style={{ margin: '1rem 0', height: 1, background: 'var(--border)' }} />

          <button 
            onClick={logout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: 'transparent',
              color: '#ef4444',
              fontWeight: 500
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div>
          {message && (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {message}
            </div>
          )}
          {renderTab()}
        </div>
      </div>
    </div>
  )
}
