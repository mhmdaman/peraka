import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle } from 'lucide-react'
import api from '../lib/api'

interface EmployeeProfileData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  address: string
  avatar: string | null
  job_title: string
  department_name: string
  manager_name: string
  date_of_joining: string
  status: string
  salary_base: string
  role: string
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/employees/${id}`)
      .then(res => setEmployee(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!employee) return <div style={{ color: 'var(--text-muted)' }}>Employee not found.</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/employees" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Employee Profile</h1>
          <p className="page-subtitle">View detailed information about the employee</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Basic Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem', overflow: 'hidden' }}>
            {employee.avatar ? <img src={employee.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${employee.first_name[0]}${employee.last_name[0]}`}
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{employee.first_name} {employee.last_name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{employee.job_title}</p>
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: 999, 
            fontSize: '0.75rem', 
            fontWeight: 600,
            background: employee.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: employee.status === 'active' ? '#10b981' : '#ef4444',
            marginBottom: '1.5rem'
          }}>
            {employee.status.toUpperCase()}
          </span>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Mail size={16} /> {employee.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Phone size={16} /> {employee.phone || 'N/A'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <MapPin size={16} /> {employee.address || 'N/A'}
            </div>
          </div>
        </div>

        {/* Right Column: Work Info */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Work Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Department</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <Briefcase size={16} color="var(--text-muted)" /> {employee.department_name || 'N/A'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Role</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <CheckCircle size={16} color="var(--text-muted)" /> {employee.role}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Date of Joining</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <Calendar size={16} color="var(--text-muted)" /> {employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Manager</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                 {employee.manager_name || 'None'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
