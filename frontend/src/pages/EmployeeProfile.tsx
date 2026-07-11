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
      <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!employee) return <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Employee not found.</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/employees" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
          <ArrowLeft size={20} strokeWidth={1.8} />
        </Link>
        <div>
          <h1 className="page-title">Employee Profile</h1>
          <p className="page-subtitle">View detailed information about the employee</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Basic Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(44,48,46,0.06)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600, marginBottom: '1.25rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {employee.avatar ? <img src={employee.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${employee.first_name[0]}${employee.last_name[0]}`}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 600 }}>{employee.first_name} {employee.last_name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>{employee.job_title}</p>
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: 2, 
            fontSize: '0.7rem', 
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: employee.status === 'active' ? 'rgba(74,109,92,0.1)' : 'rgba(122,59,59,0.1)',
            color: employee.status === 'active' ? 'var(--success)' : 'var(--danger)',
            marginBottom: '1.5rem'
          }}>
            {employee.status}
          </span>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Mail size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} /> {employee.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <Phone size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} /> {employee.phone || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>N/A</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <MapPin size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} /> {employee.address || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>N/A</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Work Info */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Work Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Department</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                <Briefcase size={16} strokeWidth={1.8} color="var(--text-muted)" /> {employee.department_name || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>N/A</span>}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Role</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                <CheckCircle size={16} strokeWidth={1.8} color="var(--text-muted)" /> <span style={{ textTransform: 'capitalize' }}>{employee.role}</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Date of Joining</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                <Calendar size={16} strokeWidth={1.8} color="var(--text-muted)" /> {employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>N/A</span>}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Manager</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                 {employee.manager_name || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
