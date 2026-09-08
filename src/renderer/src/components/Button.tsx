import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-(--color-accent) text-white hover:brightness-110 disabled:opacity-50',
  secondary:
    'bg-(--color-surface-3) text-(--color-text-primary) border border-(--color-surface-border) hover:bg-(--color-surface-2) disabled:opacity-50',
  danger: 'bg-(--color-danger) text-white hover:brightness-110 disabled:opacity-50',
  ghost:
    'bg-transparent text-(--color-text-secondary) hover:bg-(--color-surface-2) disabled:opacity-50'
}

export function Button({
  variant = 'secondary',
  loading,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
        'cursor-pointer select-none',
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
