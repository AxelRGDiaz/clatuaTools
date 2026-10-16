import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { LogPanel } from './components/LogPanel'
import { CommandPalette } from './components/CommandPalette'
import { TaskCenter } from './components/TaskCenter'
import { useNavStore } from './store/navStore'
import { initLogSubscription } from './store/logStore'
import { useSettingsStore } from './store/settingsStore'

import { Home } from './pages/Home'
import { Recipes } from './pages/Recipes'
import { Programs } from './pages/Programs'
import { QuickInstall } from './pages/QuickInstall'
import { Windows } from './pages/Windows'
import { Office } from './pages/Office'
import { Activation } from './pages/Activation'
import { Drivers } from './pages/Drivers'
import { Diagnostics } from './pages/Diagnostics'
import { Maintenance } from './pages/Maintenance'
import { Network } from './pages/Network'
import { Tools } from './pages/Tools'
import { Report } from './pages/Report'
import { Settings } from './pages/Settings'

function App(): React.JSX.Element {
  const activePage = useNavStore((s) => s.activePage)
  const togglePalette = useNavStore((s) => s.togglePalette)
  const loadSettings = useSettingsStore((s) => s.load)

  useEffect(() => {
    initLogSubscription()
    loadSettings()
  }, [loadSettings])

  // Atajo global de la Paleta de comandos: Ctrl+K (o Cmd+K) desde cualquier
  // pantalla.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        togglePalette()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePalette])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-(--color-surface-0) text-(--color-text-primary)">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-5">
          {activePage === 'home' && <Home />}
          {activePage === 'recipes' && <Recipes />}
          {activePage === 'programs' && <Programs />}
          {activePage === 'quick-install' && <QuickInstall />}
          {activePage === 'windows' && <Windows />}
          {activePage === 'office' && <Office />}
          {activePage === 'activation' && <Activation />}
          {activePage === 'drivers' && <Drivers />}
          {activePage === 'diagnostics' && <Diagnostics />}
          {activePage === 'maintenance' && <Maintenance />}
          {activePage === 'network' && <Network />}
          {activePage === 'tools' && <Tools />}
          {activePage === 'report' && <Report />}
          {activePage === 'settings' && <Settings />}
        </main>
        <LogPanel />
      </div>

      <CommandPalette />
      <TaskCenter />
    </div>
  )
}

export default App
