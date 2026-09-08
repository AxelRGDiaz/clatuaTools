import { useEffect, useRef } from 'react'
import { Trash2, Copy, Save, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'
import { useLogStore } from '../store/logStore'
import { useNavStore } from '../store/navStore'
import { formatTime } from '../lib/format'
import type { LogLevel } from '../../../shared/types'

const LEVEL_CLASSES: Record<LogLevel, string> = {
  INFO: 'text-(--color-info)',
  SUCCESS: 'text-(--color-success)',
  WARNING: 'text-(--color-warning)',
  ERROR: 'text-(--color-danger)'
}

export function LogPanel(): React.JSX.Element {
  const entries = useLogStore((s) => s.entries)
  const clear = useLogStore((s) => s.clear)
  const open = useNavStore((s) => s.logPanelOpen)
  const toggle = useNavStore((s) => s.toggleLogPanel)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, open])

  const handleCopy = (): void => {
    const text = entries
      .map((e) => `[${formatTime(e.timestamp)}] [${e.level}] ${e.message}`)
      .join('\n')
    navigator.clipboard.writeText(text)
  }

  const handleSave = (): void => {
    window.api.logs.save(entries)
  }

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col border-t border-(--color-surface-border) bg-(--color-surface-1) transition-[height] duration-200',
        open ? 'h-56' : 'h-9'
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-(--color-surface-border) px-3">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs font-medium text-(--color-text-secondary) cursor-pointer"
        >
          <ChevronDown size={14} className={cn('transition-transform', !open && '-rotate-90')} />
          Registro
          <span className="rounded-full bg-(--color-surface-3) px-1.5 py-0.5 text-[10px] text-(--color-text-muted)">
            {entries.length}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copiar registro"
            className="rounded p-1 text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text-primary) cursor-pointer"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={handleSave}
            title="Guardar como .txt"
            className="rounded p-1 text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-text-primary) cursor-pointer"
          >
            <Save size={13} />
          </button>
          <button
            onClick={clear}
            title="Limpiar registro"
            className="rounded p-1 text-(--color-text-muted) hover:bg-(--color-surface-2) hover:text-(--color-danger) cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed"
        >
          {entries.length === 0 && (
            <p className="text-(--color-text-muted)">Sin actividad todavía.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-2">
              <span className="shrink-0 text-(--color-text-muted)">
                [{formatTime(entry.timestamp)}]
              </span>
              <span className={cn('shrink-0 font-semibold', LEVEL_CLASSES[entry.level])}>
                {entry.level}
              </span>
              <span className="text-(--color-text-secondary)">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
