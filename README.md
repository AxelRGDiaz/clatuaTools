# ClatuaTech Tools

Aplicación de escritorio para Windows, pensada como "navaja suiza" para técnicos que preparan,
diagnostican y mantienen equipos. Permite instalar programas mediante `winget`, ejecutar
diagnósticos de hardware/red, reparar Windows (SFC/DISM/CHKDSK), gestionar mantenimiento básico,
detectar Office y el estado de activación de Windows, y abrir rápidamente las herramientas nativas
que un técnico usa a diario — todo desde una interfaz oscura, con un panel de registro en vivo.

## Stack

- Electron + electron-vite
- TypeScript (estricto) en los tres procesos (main / preload / renderer)
- React 19 + Zustand
- Tailwind CSS 4
- `systeminformation` para el inventario de hardware
- `winget` (Windows Package Manager) para instalar software

## Arquitectura

```
src/
  shared/            Tipos y contrato de canales IPC compartidos por los 3 procesos
  main/               Proceso principal (Node.js completo, sin exponer al renderer)
    security/         Whitelist de comandos + guard de plataforma (única fuente de verdad
                       sobre qué ejecutable/argumentos se pueden lanzar)
    services/         Lógica de negocio: winget, systeminformation, Office, activación,
                       drivers, mantenimiento, logger, admin/UAC, settings…
    ipc/handlers/      Un archivo por dominio, cada uno registra sus canales `ipcMain.handle`
    config/            apps.json, driverLinks.json, settings.default.json (catálogo editable
                       sin tocar código)
  preload/            Único puente entre renderer y main. contextIsolation habilitado,
                       nodeIntegration deshabilitado. Expone una API tipada y explícita en
                       `window.api` — nunca un `invoke(channel, ...args)` genérico.
  renderer/src/
    components/        Sidebar, TopBar, LogPanel, Card, Button, ConfirmDialog…
    pages/             Una página por sección del sidebar
    store/              Estado global con Zustand (logs, sistema, admin, settings, navegación)
```

### Seguridad (resumen)

- **`contextIsolation: true`, `nodeIntegration: false`, `sandbox` gestionado por Electron.** El
  renderer no tiene acceso a Node ni a Electron salvo lo que expone `preload/index.ts`.
- **Ningún comando se construye concatenando texto libre.** Todo lo que puede ejecutarse en el
  sistema operativo vive como entradas fijas (`exe` + `args[]`) en
  `src/main/security/commandWhitelist.ts`. El renderer solo puede enviar un identificador
  (`QuickToolId`, `WindowsRepairAction`, `MaintenanceAction`, un `appId` del catálogo de
  `apps.json`, o un host validado por regex para ping/DNS) — nunca una ruta de ejecutable ni
  argumentos arbitrarios.
- **`execFile`/`spawn` siempre, nunca `exec` con shell.** Ver `src/main/services/commandRunner.service.ts`.
- **Elevación a nivel de aplicación, no por comando.** `Start-Process -Verb RunAs` no permite
  capturar la salida estándar del proceso elevado, así que en vez de elevar cada comando por
  separado, la app detecta si ya se ejecuta como administrador y ofrece un botón "Reiniciar como
  administrador" (UAC) cuando una acción lo requiere. Ver `src/main/services/admin.service.ts`.
- **Confirmación explícita antes de acciones sensibles.** SFC/DISM/CHKDSK y las acciones de
  mantenimiento muestran una explicación y piden confirmación (`ConfirmDialog`) antes de
  ejecutarse, e indican si requieren administrador.
- **Sin activadores ni bypass de licencias.** Las secciones de Office y activación de Windows solo
  leen el estado (registro, `slmgr.vbs`, `ospp.vbs`) y abren las páginas oficiales de
  Microsoft — no incluyen ni permiten mecanismos de activación no autorizados.

## Requisitos

- Node.js 20+
- Windows 10/11 para ejecutar las funciones específicas de Windows (winget, SFC/DISM, registro,
  etc.). El proyecto también compila y arranca en macOS/Linux para desarrollar la interfaz, pero
  los servicios que dependen de comandos de Windows devuelven datos vacíos/deshabilitados fuera de
  Windows en vez de fallar (ver `src/main/security/platform.ts`).
- [Windows Package Manager (winget)](https://learn.microsoft.com/windows/package-manager/winget/)
  instalado en el equipo del técnico para la instalación automática de programas.

## Desarrollo

```bash
npm install
npm run dev
```

Esto arranca Vite + Electron con recarga en caliente. La ventana principal carga el renderer desde
el servidor de desarrollo; el proceso main y el preload se recompilan automáticamente al guardar.

### Comandos útiles

| Comando              | Qué hace                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Modo desarrollo con hot reload                                    |
| `npm run lint`         | ESLint (incluye reglas de React Hooks y Prettier)                 |
| `npm run format`       | Formatea todo el proyecto con Prettier                            |
| `npm run typecheck`    | `tsc --noEmit` para main/preload y para el renderer                |
| `npm run build`        | Typecheck + build de producción (main, preload, renderer) a `out/` |
| `npm run build:win`    | Build de producción + empaquetado NSIS para Windows (`.exe`)       |
| `npm run build:unpack` | Build de producción sin empaquetar (útil para depurar el paquete)  |

## Compilar y generar el instalador de Windows

```bash
npm run build:win
```

Genera `dist/ClatuaTech Tools-<version>-setup.exe` (instalador NSIS, arquitectura x64, permite
elegir carpeta de instalación y crea acceso directo en el escritorio). El build debe ejecutarse
en Windows, o en una máquina con las herramientas de `electron-builder` para cross-compilar a
Windows (wine + mono en Linux/macOS); en este repositorio se ha verificado el `build` de
TypeScript/Vite (`npm run build`) mientras que el empaquetado final `.exe` requiere un host o
runner de Windows para producir el binario firmado/instalable.

### Generar el `.exe` con GitHub Actions

El repositorio incluye `.github/workflows/build-windows.yml`, que compila el instalador en un
runner `windows-latest` (sin necesitar Windows en local):

- **En cada push a `main`** y en cada PR: instala dependencias, ejecuta `lint` + `typecheck` +
  `build:win`, y sube el `.exe` resultante como artefacto descargable de la ejecución del workflow
  (pestaña *Actions* → la ejecución → *Artifacts*).
- **Al hacer push de un tag `vX.Y.Z`** (por ejemplo `git tag v1.0.0 && git push origin v1.0.0`):
  además de lo anterior, crea automáticamente una GitHub Release con el `.exe` adjunto.
- También se puede lanzar manualmente desde *Actions → Build Windows installer → Run workflow*.

El instalador generado no está firmado digitalmente, así que Windows SmartScreen puede mostrar una
advertencia la primera vez que se ejecute en un equipo — es el comportamiento esperado sin un
certificado de firma de código; añadirlo (`CSC_LINK`/`CSC_KEY_PASSWORD` como secrets del repo) queda
como mejora futura si se necesita distribuir sin esa advertencia.

## Ampliar el catálogo

- **Programas instalables:** edita `src/main/config/apps.json`. Cada entrada necesita un `id`
  único, `category`, el `wingetId` exacto (verificado contra `winget show --id <id>` antes de
  publicarlo) y una `description`. Marca `quickInstall: true` para que aparezca en "Instalación
  rápida".
- **Enlaces de drivers por fabricante:** `src/main/config/driverLinks.json`.
- **Ajustes por defecto:** `src/main/config/settings.default.json`; el usuario final los sobreescribe
  desde la sección Configuración y se guardan en `app.getPath('userData')/settings.json`.

Estos archivos JSON se importan directamente en los servicios de main (no hay que tocar React para
actualizar el catálogo), lo que deja el camino abierto a sustituirlos por una fuente remota
versionada en el futuro sin cambiar la interfaz.

## Estado del proyecto / limitaciones conocidas

- Desarrollado y verificado (lint, typecheck, build) en macOS; las rutas específicas de Windows
  (winget, SFC/DISM, registro, `slmgr`/`ospp.vbs`, WMI de drivers) están implementadas contra las
  APIs y herramientas oficiales de Windows pero solo pueden probarse funcionalmente en una máquina
  Windows real.
- La instalación de Office usa el id de paquete de winget para Microsoft 365/Office; la activación
  siempre se hace iniciando sesión con una cuenta/licencia válida dentro de Office, nunca mediante
  esta aplicación.
- `npm audit` reporta un aviso de severidad alta en `extract-zip` (dependencia transitiva del
  paquete `electron` usada solo para descargar el binario de Electron durante `postinstall`, no se
  incluye en la app empaquetada). Solucionarlo implica saltar a Electron 44; queda pendiente de
  decisión antes de actualizar una dependencia mayor.
