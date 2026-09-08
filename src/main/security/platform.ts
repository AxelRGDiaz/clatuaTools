// Central platform guard. Every Windows-only service checks this instead of
// scattering `process.platform === 'win32'` everywhere, and it gives us a
// single place to explain why: this app targets Windows exclusively, but we
// develop/build the renderer on any OS, so services degrade gracefully
// instead of throwing when run outside Windows.

export const isWindows = process.platform === 'win32'
