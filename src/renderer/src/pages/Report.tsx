import { useEffect, useState } from 'react'
import { FileText, FileDown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useSystemStore } from '../store/systemStore'
import { useLogStore } from '../store/logStore'
import { formatBytes, formatPercent, formatTime } from '../lib/format'
import type { ActivationStatus, OfficeStatus, LogEntry } from '../../../shared/types'

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface ReportInputs {
  technician: string
  notes: string
  activation: ActivationStatus | null
  office: OfficeStatus | null
  entries: LogEntry[]
}

function buildReportHtml(
  snapshot: ReturnType<typeof useSystemStore.getState>['snapshot'],
  inputs: ReportInputs
): string {
  const now = new Date()
  const disk = snapshot?.disks?.[0]
  const { technician, notes, activation, office, entries } = inputs

  const infoRows: Array<[string, string]> = [
    ['Equipo', esc(snapshot?.computerName)],
    ['Placa base', snapshot ? esc(`${snapshot.board.manufacturer} ${snapshot.board.model}`) : '—'],
    ['Sistema', esc(snapshot?.os.distro)],
    [
      'Versión / build',
      snapshot ? esc(`${snapshot.os.release} · build ${snapshot.os.build}`) : '—'
    ],
    ['Arquitectura', esc(snapshot?.os.arch)],
    ['Usuario', esc(snapshot?.currentUser)],
    ['CPU', esc(snapshot?.cpu.brand)],
    [
      'RAM',
      snapshot
        ? esc(
            `${formatBytes(snapshot.ram.totalBytes)} (${formatPercent(snapshot.ram.usedPercent)} en uso)`
          )
        : '—'
    ],
    [
      'Disco',
      disk
        ? esc(
            `${disk.model} · ${formatBytes(disk.sizeBytes)} (${formatBytes(disk.freeBytes)} libres)`
          )
        : '—'
    ],
    ['GPU', esc(snapshot?.gpu?.[0]?.model)],
    ['Red (IP)', esc(snapshot?.primaryIp)]
  ]

  const statusRows: Array<[string, string]> = [
    ['Activación de Windows', activation ? esc(activation.licenseStatus) : '—'],
    ['Edición', activation ? esc(activation.edition) : '—'],
    [
      'Office',
      office
        ? office.installed
          ? esc(office.products[0]?.name ?? 'Instalado')
          : 'No detectado'
        : '—'
    ]
  ]

  const actions = entries
    .filter((e) => e.level !== 'INFO')
    .slice(-60)
    .map(
      (e) =>
        `<tr><td class="t">${esc(formatTime(e.timestamp))}</td><td><span class="lv lv-${e.level}">${e.level}</span></td><td>${esc(e.message)}</td></tr>`
    )
    .join('')

  const row = ([k, v]: [string, string]): string => `<tr><th>${k}</th><td>${v}</td></tr>`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Informe de entrega</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1f26; margin: 0; padding: 32px 36px; font-size: 12.5px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  .sub { color: #5a6776; font-size: 12px; margin: 0 0 18px; }
  .meta { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 20px; font-size: 12px; }
  .meta b { color: #5a6776; font-weight: 600; display: block; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; }
  h2 { font-size: 13.5px; margin: 22px 0 8px; padding-bottom: 5px; border-bottom: 2px solid #1e88e5; color: #0d47a1; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e3e8ee; vertical-align: top; }
  th { width: 180px; color: #5a6776; font-weight: 600; }
  .log th, .log td { border-bottom: 1px solid #eef1f5; }
  .log .t { width: 70px; color: #5a6776; font-variant-numeric: tabular-nums; }
  .lv { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
  .lv-SUCCESS { background: #e4f6ec; color: #1e8e5a; }
  .lv-WARNING { background: #fdf3e0; color: #9a6400; }
  .lv-ERROR { background: #fbe6e5; color: #b8302a; }
  .notes { white-space: pre-wrap; border: 1px solid #e3e8ee; border-radius: 8px; padding: 12px; min-height: 48px; color: #1a1f26; }
  .empty { color: #8a98a7; font-style: italic; }
  .foot { margin-top: 28px; color: #8a98a7; font-size: 10.5px; border-top: 1px solid #e3e8ee; padding-top: 10px; }
</style></head><body>
  <h1>Informe de entrega</h1>
  <p class="sub">ClatuaTech Tools · Diagnóstico y mantenimiento de equipo</p>
  <div class="meta">
    <div><b>Fecha</b>${esc(now.toLocaleString('es-CL'))}</div>
    <div><b>Equipo</b>${esc(snapshot?.computerName)}</div>
    <div><b>Técnico</b>${esc(technician || '—')}</div>
  </div>

  <h2>Resumen del equipo</h2>
  <table>${infoRows.map(row).join('')}</table>

  <h2>Estado del sistema</h2>
  <table>${statusRows.map(row).join('')}</table>

  <h2>Acciones realizadas en esta sesión</h2>
  ${actions ? `<table class="log">${actions}</table>` : '<p class="empty">No se registraron acciones en esta sesión.</p>'}

  <h2>Notas del técnico</h2>
  <div class="notes">${notes ? esc(notes) : '<span class="empty">Sin notas.</span>'}</div>

  <p class="foot">Generado por ClatuaTech Tools el ${esc(now.toLocaleString('es-CL'))}.</p>
</body></html>`
}

export function Report(): React.JSX.Element {
  const { snapshot, refresh } = useSystemStore()
  const entries = useLogStore((s) => s.entries)
  const [technician, setTechnician] = useState('')
  const [notes, setNotes] = useState('')
  const [activation, setActivation] = useState<ActivationStatus | null>(null)
  const [office, setOffice] = useState<OfficeStatus | null>(null)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    refresh()
    window.api.activation.check().then(setActivation)
    window.api.office.detect().then(setOffice)
  }, [refresh])

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    setResult(null)
    const html = buildReportHtml(snapshot, { technician, notes, activation, office, entries })
    const date = new Date().toISOString().slice(0, 10)
    const name = `Informe-${(snapshot?.computerName ?? 'equipo').replace(/[^\w.-]+/g, '_')}-${date}.pdf`
    const res = await window.api.report.exportPdf({ html, defaultFileName: name })
    setExporting(false)
    if (res.ok) {
      setResult({ ok: true, text: `Informe guardado en ${res.path}` })
    } else if (res.canceled) {
      setResult(null)
    } else {
      setResult({ ok: false, text: res.error ?? 'No se pudo generar el PDF.' })
    }
  }

  const sessionActions = entries.filter((e) => e.level !== 'INFO')

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Informe de entrega"
        icon={<FileText size={16} />}
        action={
          <Button
            variant="primary"
            icon={
              exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />
            }
            loading={exporting}
            onClick={handleExport}
          >
            Exportar PDF
          </Button>
        }
      >
        <p className="mb-3 text-xs text-(--color-text-secondary)">
          Genera un PDF para el cliente con el estado actual del equipo, las acciones realizadas en
          esta sesión y tus notas. Se abrirá un diálogo para elegir dónde guardarlo.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
              Técnico
            </label>
            <input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="Nombre del técnico"
              className="w-full rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
            />
          </div>
          <div className="sm:row-span-2">
            <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
              Notas de entrega
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observaciones, recomendaciones, pendientes…"
              className="w-full resize-y rounded-lg border border-(--color-surface-border) bg-(--color-surface-2) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
            />
          </div>
        </div>

        {result && (
          <div
            className={
              result.ok
                ? 'mt-3 flex items-center gap-2 rounded-lg border border-(--color-success)/30 bg-(--color-success)/10 px-3 py-2 text-xs text-(--color-success)'
                : 'mt-3 flex items-center gap-2 rounded-lg border border-(--color-danger)/30 bg-(--color-danger)/10 px-3 py-2 text-xs text-(--color-danger)'
            }
          >
            {result.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span className="min-w-0 break-all">{result.text}</span>
          </div>
        )}
      </Card>

      <Card title="Vista previa del contenido">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              Equipo
            </p>
            <dl className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-text-secondary)">Nombre</dt>
                <dd className="text-(--color-text-primary)">{snapshot?.computerName ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-text-secondary)">Sistema</dt>
                <dd className="truncate text-(--color-text-primary)">
                  {snapshot?.os.distro ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-text-secondary)">Activación</dt>
                <dd>
                  {activation ? (
                    <Badge tone={activation.isActivated ? 'success' : 'warning'}>
                      {activation.licenseStatus}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-text-secondary)">Office</dt>
                <dd className="text-(--color-text-primary)">
                  {office ? (office.installed ? 'Instalado' : 'No detectado') : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              Acciones de esta sesión ({sessionActions.length})
            </p>
            {sessionActions.length === 0 ? (
              <p className="text-xs text-(--color-text-muted)">
                Todavía no se registran acciones. Ejecuta recetas o reparaciones y aparecerán aquí.
              </p>
            ) : (
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs">
                {sessionActions
                  .slice(-30)
                  .reverse()
                  .map((e) => (
                    <li key={e.id} className="flex gap-2">
                      <span className="shrink-0 text-(--color-text-muted)">
                        {formatTime(e.timestamp)}
                      </span>
                      <span className="text-(--color-text-secondary)">{e.message}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
