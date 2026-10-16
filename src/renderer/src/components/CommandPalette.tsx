import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft, ShieldAlert } from 'lucide-react'
import { cn } from '../lib/cn'
import { useNavStore, type PageId } from '../store/navStore'
import { useTaskStore } from '../store/taskStore'
import { OS_ACTIONS } from '../lib/actions'
import { RECIPES } from '../lib/recipes'
import { runRecipe } from '../lib/runRecipe'
import { PAGE_TITLES } from '../lib/pages'

interface Command {
  id: string
  title: string
  group: string
  keywords?: string
  hint?: string
  perform: () => void
}

// El diálogo se monta de cero cada vez que se abre (ver CommandPalette), así
// su estado (texto y selección) arranca limpio sin necesidad de resetearlo en
// un efecto.
function PaletteDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const setActivePage = useNavStore((s) => s.setActivePage)
  const [query, setQuery] = useState('')
  const [selectedRaw, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const go = (page: PageId): Command => ({
      id: `go:${page}`,
      title: PAGE_TITLES[page],
      group: 'Ir a',
      keywords: 'navegar ir pantalla',
      perform: () => setActivePage(page)
    })

    const navCommands = (Object.keys(PAGE_TITLES) as PageId[]).map(go)

    const recipeCommands: Command[] = RECIPES.map((recipe) => ({
      id: `recipe:${recipe.id}`,
      title: recipe.name,
      group: 'Recetas',
      keywords: recipe.description,
      hint: `${recipe.stepActionIds.length} pasos`,
      perform: () => {
        setActivePage('recipes')
        void runRecipe(recipe)
      }
    }))

    const actionCommands: Command[] = OS_ACTIONS.map((action) => ({
      id: action.id,
      title: action.title,
      group: action.group,
      keywords: action.keywords,
      hint: action.requiresAdmin ? 'Admin' : undefined,
      perform: () => {
        if (action.longRunning) {
          void useTaskStore
            .getState()
            .run({ title: action.title, indeterminate: action.indeterminate }, () => action.run())
        } else {
          void action.run()
        }
      }
    }))

    return [...navCommands, ...recipeCommands, ...actionCommands]
  }, [setActivePage])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.title} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q)
    )
  }, [commands, query])

  // Selección acotada al rango actual sin guardar estado derivado.
  const selected = Math.min(selectedRaw, Math.max(filtered.length - 1, 0))

  // Enfoca el input al montar (efecto de DOM puro, sin setState).
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [])

  const runSelected = (): void => {
    const cmd = filtered[selected]
    if (!cmd) return
    onClose()
    cmd.perform()
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(Math.min(selected + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(Math.max(selected - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runSelected()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/50 pt-[12vh] backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Paleta de comandos"
        className="animate-fade-in relative flex max-h-[68vh] w-[640px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-(--color-surface-border) bg-(--color-surface-1) shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <label className="flex items-center gap-3 border-b border-(--color-surface-border) px-4 py-3.5">
          <Search size={17} className="shrink-0 text-(--color-text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            placeholder="Buscar acción, herramienta o receta…"
            aria-label="Buscar acción, herramienta o receta"
            className="flex-1 bg-transparent text-base text-(--color-text-primary) outline-none placeholder:text-(--color-text-muted)"
          />
          <span className="rounded border border-(--color-surface-border) px-1.5 py-0.5 font-mono text-[10px] text-(--color-text-muted)">
            esc
          </span>
        </label>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-(--color-text-muted)">
              Sin resultados para “{query}”.
            </p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onMouseEnter={() => setSelected(i)}
                onClick={() => {
                  onClose()
                  cmd.perform()
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer',
                  i === selected ? 'bg-(--color-accent-soft)' : 'hover:bg-(--color-surface-2)'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      i === selected ? 'text-(--color-accent-text)' : 'text-(--color-text-primary)'
                    )}
                  >
                    {cmd.title}
                  </p>
                  <p className="truncate text-xs text-(--color-text-muted)">{cmd.group}</p>
                </div>
                {cmd.hint === 'Admin' ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-(--color-warning)/30 bg-(--color-warning)/10 px-2 py-0.5 text-[10.5px] font-medium text-(--color-warning)">
                    <ShieldAlert size={11} />
                    Admin
                  </span>
                ) : cmd.hint ? (
                  <span className="shrink-0 text-[11px] text-(--color-text-muted)">{cmd.hint}</span>
                ) : null}
                {i === selected && (
                  <CornerDownLeft size={13} className="shrink-0 text-(--color-text-muted)" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 border-t border-(--color-surface-border) bg-(--color-surface-1) px-4 py-2 text-[11px] text-(--color-text-muted)">
          <span>↑ ↓ navegar</span>
          <span>↵ ejecutar</span>
          <span className="flex-1" />
          <span>Ctrl K desde cualquier pantalla</span>
        </div>
      </div>
    </div>
  )
}

export function CommandPalette(): React.JSX.Element | null {
  const open = useNavStore((s) => s.paletteOpen)
  const setOpen = useNavStore((s) => s.setPaletteOpen)

  if (!open) return null
  return <PaletteDialog onClose={() => setOpen(false)} />
}
