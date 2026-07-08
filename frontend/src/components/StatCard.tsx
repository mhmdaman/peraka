import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  color?: string
  subtitle?: string
}

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = '#6366f1', subtitle }: StatCardProps) {
  const positive = (trend ?? 0) >= 0
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow bg */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140,
        borderRadius: '50%', background: color, opacity: 0.06, pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: '0.25rem' }}>{value}</p>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}33`
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: positive ? 'var(--success)' : 'var(--danger)' }}>
            {positive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trendLabel ?? 'vs last month'}</span>
        </div>
      )}
    </div>
  )
}
