interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = { sm: 28, md: 36, lg: 44, xl: 64 }
const fontSizes = { sm: 11, md: 13, lg: 16, xl: 22 }

// Monochrome ink-wash tones
const colors = [
  ['#3C3830', '#2C302E'],
  ['#4A4E4C', '#3C3830'],
  ['#5A5E5C', '#4A4E4C'],
  ['#626864', '#525854'],
  ['#6E746F', '#5E645F'],
  ['#7A807B', '#6A706B'],
  ['#8A8D89', '#7A7D79'],
  ['#969A96', '#868A86'],
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
        fontSize: fs, fontWeight: 600, color: '#F7F5EF',
        border: '1.5px solid rgba(60, 56, 48, 0.1)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.02em',
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : initials}
    </div>
  )
}
