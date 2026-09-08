import { cn } from '../lib/cn'

export function ProgressBar({
  value,
  tone = 'accent'
}: {
  value: number
  tone?: 'accent' | 'warning' | 'danger'
}): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  const toneClass =
    tone === 'warning'
      ? 'bg-(--color-warning)'
      : tone === 'danger'
        ? 'bg-(--color-danger)'
        : 'bg-(--color-accent)'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-3)">
      <div
        className={cn('h-full rounded-full transition-all duration-300', toneClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
