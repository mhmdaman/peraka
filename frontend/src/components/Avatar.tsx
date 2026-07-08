interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = { sm: 28, md: 36, lg: 44, xl: 64 }
const fontSizes = { sm: 11, md: 13, lg: 16, xl: 22 }

const colors = [
  ['#6366f1', '#4f46e5'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#3b82f6', '#2563eb'],
  ['#ef4444', '#dc2626'],
  ['#06b6d4', '#0891b2'],
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ name = 'User', src, size = 'md', className = '' }: AvatarProps) {
  const px = sizes[size]
  const fs = fontSizes[size]
  const [bg, dark] = getColor(name)
  const initials = getInitials(name)

  return (
    <div
      className={className}
      style={{
        width: px, height: px, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${bg}, ${dark})`,
        fontSize: fs, fontWeight: 600, color: 'white',
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : initials}
    </div>
  )
}
