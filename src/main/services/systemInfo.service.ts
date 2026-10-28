// Gathers hardware/OS information via the `systeminformation` package,
// which itself reads from WMI/registry/proc on the appropriate platform.
// No shell commands are built here.

import si from 'systeminformation'
import os from 'os'
import type { SystemSnapshot } from '../../shared/types'
import { isElevated } from './admin.service'
import { cachedQuery } from './cache'

// Hardware that can't change while the app is open (CPU model, board, BIOS,
// GPUs, physical disks, OS build) is read once per session. These are the
// slowest WMI queries (~2-3 s on Windows), so every "Actualizar" after the
// first only re-reads the live values (load, RAM, free space, network).
const staticHardware = cachedQuery(24 * 60 * 60 * 1000, () =>
  Promise.all([
    si.cpu(),
    si.graphics().catch(() => ({ controllers: [] })),
    si.diskLayout().catch(() => []),
    si.blockDevices().catch(() => []),
    si.osInfo(),
    si.bios().catch(() => null),
    si.baseboard().catch(() => null)
  ])
)

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  const [
    [cpuData, graphics, diskLayout, blockDevices, osInfo, biosData, boardData],
    cpuLoad,
    mem,
    fsSize,
    networkInterfaces,
    defaultIface,
    defaultGateway,
    admin
  ] = await Promise.all([
    staticHardware.get(),
    si.currentLoad().catch(() => null),
    si.mem(),
    si.fsSize().catch(() => []),
    si.networkInterfaces().catch(() => []),
    si.networkInterfaceDefault().catch(() => ''),
    si.networkGatewayDefault().catch(() => ''),
    isElevated()
  ])

  // fsSize only knows volumes ("C:"); blockDevices maps each volume to its
  // physical drive ("\\.\PHYSICALDRIVE1"), which is what diskLayout
  // (model, SSD/HDD) is keyed by.
  const physicalFor = (mount: string): (typeof diskLayout)[number] | undefined => {
    const block = blockDevices.find((b) => b.mount === mount || b.name === mount)
    return block?.device ? diskLayout.find((dl) => dl.device === block.device) : undefined
  }

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
    disks: fsSize.map((d) => {
      const physical = physicalFor(d.mount)
      return {
        device: d.fs,
        type: physical?.type || 'Desconocido',
        model: physical?.name || 'Desconocido',
        sizeBytes: d.size,
        freeBytes: d.available ?? null,
        mount: d.mount
      }
    }),
    network: ifaceList
      .filter((n) => n.iface && !n.internal)
      .map((n) => ({
        iface: n.iface,
        ip4: n.ip4 ?? '',
        ip6: n.ip6 ?? '',
        mac: n.mac ?? '',
        // systeminformation's interface list carries no gateway; it only
        // reports the default one, which belongs to the default interface.
        gateway: n.iface === defaultIface && defaultGateway ? defaultGateway : null,
        dns: [],
        isUp: n.operstate === 'up'
      })),
    primaryIp: primary?.ip4 ?? null,
    online: ifaceList.some((n) => n.operstate === 'up' && !n.internal),
    timestamp: new Date().toISOString()
  }

  return snapshot
}
