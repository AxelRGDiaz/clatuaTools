// Tiny TTL cache for expensive, read-only system queries (winget, Office,
// activation). Several pages ask for the same data on every mount; without
// this each visit would spawn new PowerShell/cscript/winget processes.
// Concurrent callers share the same in-flight promise.

export interface CachedQuery<T> {
  get: (force?: boolean) => Promise<T>
  invalidate: () => void
}

export function cachedQuery<T>(ttlMs: number, fn: () => Promise<T>): CachedQuery<T> {
  let value: Promise<T> | null = null
  let expiresAt = 0

  return {
    get(force = false) {
      if (!force && value && Date.now() < expiresAt) return value
      expiresAt = Date.now() + ttlMs
      const pending = fn()
      value = pending
      // Never cache a failure.
      pending.catch(() => {
        if (value === pending) value = null
      })
      return pending
    },
    invalidate() {
      value = null
    }
  }
}
