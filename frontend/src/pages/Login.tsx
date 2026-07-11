import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'var(--font-body)',
      position: 'relative'
    }}>

      <div style={{
        width: '100%',
        maxWidth: 900,
        height: 600,
        background: 'var(--bg-card)',
        backgroundImage: 'var(--paper-texture)',
        borderRadius: 2,
        boxShadow: '0 20px 40px rgba(44, 48, 46, 0.15)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        border: '1px solid var(--border)'
      }}>
        
        {/* Left Side: Form */}
        <div style={{
          width: '50%',
          padding: '3rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          borderRight: '1px solid var(--border)'
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>
            Log in
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(122,59,59,0.06)', border: '1px solid rgba(122,59,59,0.12)',
                borderRadius: 2, padding: '0.75rem 1rem',
                color: 'var(--danger)', fontSize: '0.8125rem',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email or phone number
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="input"
                style={{ borderRadius: 2 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="input"
                  style={{ borderRadius: 2, paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.875rem',
                marginTop: '0.5rem',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              ) : 'Enter Portal'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '2.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{ padding: '0 1rem', fontStyle: 'italic' }}>or log in with</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button className="btn btn-secondary" style={{ width: 48, height: 48, justifyContent: 'center', padding: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>G</span>
            </button>
            <button className="btn btn-secondary" style={{ width: 48, height: 48, justifyContent: 'center', padding: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>M</span>
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8125rem', fontStyle: 'italic' }}>
              Forgot password?
            </a>
          </div>
          
          {/* Hidden but accessible demo creds for easy testing */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', opacity: 0.2, transition: 'opacity 0.2s', fontSize: '0.65rem' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.2'}>
            Admin: admin@company.com / Admin@123<br/>
            (Hover to see demo creds)
          </div>
        </div>

        {/* Right Side: Image Graphic */}
        <div style={{
          width: '50%',
          position: 'relative',
          background: 'var(--bg-surface)',
          overflow: 'hidden'
        }}>
          {/* Sumi-e / Ink Wash image background */}
          <img 
            src="https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=2000&auto=format&fit=crop" 
            alt="Ink Wash Art" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2) sepia(10%)' }} 
          />
          {/* Paper texture overlay on image */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--paper-texture)', mixBlendMode: 'multiply', opacity: 0.8 }} />
        </div>
      </div>
      
    </div>
  )
}
