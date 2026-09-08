import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface CardProps {
  title?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, icon, action, children, className }: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-surface-border) bg-(--color-surface-1) p-4 shadow-sm',
        'animate-fade-in',
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-(--color-accent)">{icon}</span>}
            {title && (
              <h3 className="text-sm font-semibold text-(--color-text-primary)">{title}</h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
