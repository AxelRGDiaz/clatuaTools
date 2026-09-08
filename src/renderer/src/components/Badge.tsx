import { cn } from '../lib/cn'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<Tone, string> = {
  success: 'bg-(--color-success)/15 text-(--color-success) border-(--color-success)/30',
  warning: 'bg-(--color-warning)/15 text-(--color-warning) border-(--color-warning)/30',
  danger: 'bg-(--color-danger)/15 text-(--color-danger) border-(--color-danger)/30',
  info: 'bg-(--color-info)/15 text-(--color-info) border-(--color-info)/30',
  neutral: 'bg-(--color-surface-3) text-(--color-text-secondary) border-(--color-surface-border)'
}

export function Badge({
  tone = 'neutral',
  children
}: {
  tone?: Tone
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  )
}
