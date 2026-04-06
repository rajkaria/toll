import type { StateStore } from "./index.js"

/**
 * Redis-backed state store. Requires `ioredis` as optional peer dependency.
 * Install: pnpm add ioredis
 */
export class RedisStore implements StateStore {
  private client: unknown
  private prefix: string

  constructor(url: string, prefix?: string) {
    this.prefix = prefix ?? "toll:"
    // Dynamic import to keep ioredis optional
    this.initClient(url)
  }

  private async initClient(url: string): Promise<void> {
    try {
      const Redis = (await import("ioredis")).default
      this.client = new Redis(url)
    } catch {
      throw new Error("ioredis not installed. Run: pnpm add ioredis")
    }
  }

  private key(k: string): string {
    return `${this.prefix}${k}`
  }

  private redis(): Record<string, CallableFunction> {
    if (!this.client) throw new Error("Redis not initialized")
    return this.client as Record<string, CallableFunction>
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis().get(this.key(key)) as string | null
    if (val === null) return null
    try { return JSON.parse(val) as T } catch { return val as T }
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttlMs) {
      await this.redis().set(this.key(key), serialized, "PX", ttlMs)
    } else {
      await this.redis().set(this.key(key), serialized)
    }
  }

  async incr(key: string): Promise<number> {
    return (await this.redis().incr(this.key(key))) as number
  }

  async del(key: string): Promise<void> {
    await this.redis().del(this.key(key))
  }

  async has(key: string): Promise<boolean> {
    return ((await this.redis().exists(this.key(key))) as number) > 0
  }
}
