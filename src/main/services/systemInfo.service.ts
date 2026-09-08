// Gathers hardware/OS information via the `systeminformation` package,
// which itself reads from WMI/registry/proc on the appropriate platform.
// No shell commands are built here.

import si from 'systeminformation'
import os from 'os'
import type { SystemSnapshot } from '../../shared/types'
import { isElevated } from './admin.service'

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [
    cpuData,
    cpuLoad,
    mem,
    graphics,
    diskLayout,
    fsSize,
    osInfo,
    biosData,
    boardData,
    networkInterfaces,
    defaultIface,
    admin
  ] = await Promise.all([
    si.cpu(),
    si.currentLoad().catch(() => null),
    si.mem(),
    si.graphics().catch(() => ({ controllers: [] })),
    si.diskLayout().catch(() => []),
    si.fsSize().catch(() => []),
    si.osInfo(),
    si.bios().catch(() => null),
    si.baseboard().catch(() => null),
    si.networkInterfaces().catch(() => []),
    si.networkInterfaceDefault().catch(() => ''),
    isElevated()
  ])

  const ifaceList = Array.isArray(networkInterfaces) ? networkInterfaces : [networkInterfaces]
  const primary =
    ifaceList.find((n) => n.iface === defaultIface) ?? ifaceList.find((n) => n.operstate === 'up')

  const snapshot: SystemSnapshot = {
    computerName: os.hostname(),
    currentUser: os.userInfo().username,
    isAdmin: admin,
    os: {
      distro: osInfo.distro,
      release: osInfo.release,
      build: osInfo.build,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      uefi: osInfo.uefi ?? null
    },
    board: {
      manufacturer: boardData?.manufacturer ?? 'Desconocido',
      model: boardData?.model ?? 'Desconocido',
      biosVendor: biosData?.vendor ?? 'Desconocido',
      biosVersion: biosData?.version ?? 'Desconocido'
    },
    cpu: {
      manufacturer: cpuData.manufacturer,
      brand: cpuData.brand,
      cores: cpuData.cores,
      physicalCores: cpuData.physicalCores,
      speed: cpuData.speed,
      currentLoad: cpuLoad ? Math.round(cpuLoad.currentLoad * 10) / 10 : null
    },
    ram: {
      totalBytes: mem.total,
      freeBytes: mem.available,
      usedBytes: mem.total - mem.available,
      usedPercent: Math.round(((mem.total - mem.available) / mem.total) * 1000) / 10
    },
    gpu: graphics.controllers.map((c) => ({
      model: c.model ?? 'Desconocido',
      vendor: c.vendor ?? 'Desconocido',
      vramBytes: typeof c.vram === 'number' && c.vram > 0 ? c.vram * 1024 * 1024 : null
    })),
    disks: fsSize.map((d) => ({
      device: d.fs,
      type: diskLayout.find((dl) => d.fs.startsWith(dl.device ?? '\0'))?.type ?? 'Desconocido',
      model: diskLayout[0]?.name ?? 'Desconocido',
      sizeBytes: d.size,
      freeBytes: d.available ?? null,
      mount: d.mount
    })),
    network: ifaceList
      .filter((n) => n.iface && !n.internal)
      .map((n) => ({
        iface: n.iface,
        ip4: n.ip4 ?? '',
        ip6: n.ip6 ?? '',
        mac: n.mac ?? '',
        gateway: (n as { gateway?: string }).gateway ?? null,
        dns: [],
        isUp: n.operstate === 'up'
      })),
    primaryIp: primary?.ip4 ?? null,
    online: ifaceList.some((n) => n.operstate === 'up' && !n.internal),
    timestamp: new Date().toISOString()
  }

  return snapshot
}
