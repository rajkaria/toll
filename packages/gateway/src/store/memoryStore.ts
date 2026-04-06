import type { StateStore } from "./index.js"

interface Entry {
  value: unknown
  expiresAt: number | null
}

export class MemoryStore implements StateStore {
  private data = new Map<string, Entry>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.data.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.data.delete(key)
      return null
    }
    return entry.value as T
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    this.data.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    })
  }

  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key)
    const next = (current ?? 0) + 1
    await this.set(key, next)
    return next
  }

  async del(key: string): Promise<void> {
    this.data.delete(key)
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null
  }
}
