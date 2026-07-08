type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const statusMap: Record<string, BadgeVariant> = {
  active: 'success', approved: 'success', paid: 'success', present: 'success', completed: 'success',
  pending: 'warning', 'in-progress': 'info', late: 'warning', 'half-day': 'purple',
  rejected: 'danger', inactive: 'gray', suspended: 'danger', cancelled: 'gray', absent: 'danger',
  'on-leave': 'purple',
  admin: 'purple', manager: 'info', employee: 'gray',
  low: 'gray', medium: 'info', high: 'warning', urgent: 'danger',
  sick: 'danger', casual: 'info', unpaid: 'warning', maternity: 'purple',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function StatusBadge({ value }: { value: string }) {
  const variant = statusMap[value?.toLowerCase()] ?? 'gray'
  return <Badge variant={variant}>{value}</Badge>
}
