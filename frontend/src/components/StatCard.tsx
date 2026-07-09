import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
}

export default function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color="var(--text-muted)" strokeWidth={2} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
