import { Check } from 'lucide-react'
import { cn } from '../lib/cn'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled
}: CheckboxProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) p-3 transition-colors',
        checked && 'border-(--color-accent)/50 bg-(--color-accent-soft)',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border border-(--color-surface-border) bg-(--color-surface-0)',
          checked && 'border-(--color-accent) bg-(--color-accent)'
        )}
      >
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-(--color-text-primary)">{label}</span>
        {description && (
          <span className="text-xs text-(--color-text-secondary)">{description}</span>
        )}
      </span>
    </label>
  )
}
