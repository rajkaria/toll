/**
 * StateStore — pluggable storage backend for Toll's runtime state.
 * Abstracts rate limiting, replay guard, and spending policy state
 * so it can be backed by memory (default) or Redis (production).
 */

export interface StateStore {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlMs?: number): Promise<void>
  incr(key: string): Promise<number>
  del(key: string): Promise<void>
  has(key: string): Promise<boolean>
}

export interface StoreConfig {
  type?: "memory" | "redis"
  redis?: { url?: string; prefix?: string }
}

export async function createStore(config?: StoreConfig): Promise<StateStore> {
  if (config?.type === "redis" && config.redis?.url) {
    try {
      const { RedisStore } = await import("./redisStore.js")
      return new RedisStore(config.redis.url, config.redis.prefix)
    } catch {
      console.warn("[Toll] Redis unavailable, falling back to memory store")
    }
  }
  const { MemoryStore } = await import("./memoryStore.js")
  return new MemoryStore()
}

export type { StoreConfig as StateStoreConfig }
