import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  requiresAdmin?: boolean
  dangerous?: boolean
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  requiresAdmin,
  dangerous,
  confirmLabel = 'Continuar',
  loading,
  onConfirm,
  onCancel
}: ConfirmDialogProps): React.JSX.Element | null {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-xl border border-(--color-surface-border) bg-(--color-surface-1) p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          {dangerous ? (
            <AlertTriangle size={20} className="text-(--color-danger)" />
          ) : (
            <ShieldAlert size={20} className="text-(--color-accent)" />
          )}
          <h2 className="text-base font-semibold text-(--color-text-primary)">{title}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-(--color-text-secondary)">{description}</p>
        {requiresAdmin && (
          <p className="mb-4 rounded-lg border border-(--color-warning)/30 bg-(--color-warning)/10 px-3 py-2 text-xs text-(--color-warning)">
            Esta acción requiere privilegios de administrador.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={dangerous ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
