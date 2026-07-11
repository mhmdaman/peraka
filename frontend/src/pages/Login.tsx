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
      background: '#eef2ee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '"Inter", sans-serif',
      position: 'relative'
    }}>
      {/* Background blurred leaves */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'blur(8px)',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: 900,
        height: 600,
        background: '#ffffff',
        borderRadius: 30,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left Side: Form */}
        <div style={{
          width: '50%',
          padding: '3rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '2.5rem' }}>
            Log in
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '0.75rem 1rem',
                color: '#ef4444', fontSize: '0.875rem',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.4rem', fontWeight: 500 }}>
                Login, email or phone number
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 999,
                  border: '1px solid #ccc',
                  outline: 'none',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.4rem', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: 999,
                    border: '1px solid #ccc',
                    outline: 'none',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    paddingRight: '3rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: 999,
                border: 'none',
                background: '#3f574d',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {loading ? (
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              ) : 'Log in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: '#aaa', fontSize: '0.8rem' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0e0e0' }} />
            <span style={{ padding: '0 1rem' }}>or log in with</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0e0e0' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button style={{
              width: 48, height: 48, borderRadius: 12, border: '1px solid #e0e0e0', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{ width: 20 }} />
            </button>
            <button style={{
              width: 48, height: 48, borderRadius: 12, border: '1px solid #e0e0e0', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e5/Microsoft_Office_logo_%282013%E2%80%932019%29.svg" alt="Microsoft Office" style={{ width: 22 }} />
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="#" style={{ color: '#7b9c8c', textDecoration: 'none', fontSize: '0.85rem' }}>
              Forgot Login or password?
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
          background: '#eef2ee',
          overflow: 'hidden'
        }}>
          {/* The wavy SVG cut out */}
          <div style={{
            position: 'absolute',
            left: -1,
            top: 0,
            bottom: 0,
            width: '120px',
            zIndex: 10,
            filter: 'drop-shadow(5px 0 10px rgba(0,0,0,0.15))'
          }}>
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,0 L100,0 C60,100 40,200 60,300 C80,400 90,500 50,600 C10,700 40,750 0,800 Z" fill="#ffffff" />
            </svg>
          </div>

          {/* Additional shadow layers for depth */}
          <div style={{
            position: 'absolute',
            left: 10,
            top: 0,
            bottom: 0,
            width: '120px',
            zIndex: 9,
            filter: 'drop-shadow(10px 0 15px rgba(0,0,0,0.3))'
          }}>
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,0 L100,0 C70,120 50,220 70,320 C90,420 80,520 40,620 C0,720 30,760 0,800 Z" fill="#cfd9cf" />
            </svg>
          </div>

          <div style={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: '120px',
            zIndex: 8,
            filter: 'drop-shadow(15px 0 20px rgba(0,0,0,0.5))'
          }}>
            <svg viewBox="0 0 100 800" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,0 L100,0 C80,140 60,240 80,340 C100,440 70,540 30,640 C-10,740 20,780 0,800 Z" fill="#1c2d22" />
            </svg>
          </div>

          {/* Leaf image background */}
          <img 
            src="https://images.unsplash.com/photo-1596541223130-5d56a7a9f04e?q=80&w=2000&auto=format&fit=crop" 
            alt="Leaves" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      </div>
      
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
