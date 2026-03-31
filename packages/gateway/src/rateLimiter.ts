import type { TollToolConfig } from "@toll/stellar"

interface UsageEntry {
  count: number
  windowStart: number
}

export class RateLimiter {
  // Map key: `${callerId}:${tool}`
  private usage = new Map<string, UsageEntry>()

  private key(callerId: string, tool: string): string {
    return `${callerId}:${tool}`
  }

  isWithinFreeTier(callerId: string, tool: string, toolConfig: TollToolConfig): boolean {
    if (!toolConfig.rateLimit) return false

    const { free, perHour } = toolConfig.rateLimit
    const key = this.key(callerId, tool)
    const now = Date.now()
    const windowMs = perHour ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000

    const entry = this.usage.get(key)
    if (!entry || now - entry.windowStart > windowMs) {
      return true
    }

    return entry.count < free
  }

  increment(callerId: string, tool: string): void {
    const key = this.key(callerId, tool)
    const now = Date.now()
    const entry = this.usage.get(key)
    const windowMs = 60 * 60 * 1000

    if (!entry || now - entry.windowStart > windowMs) {
      this.usage.set(key, { count: 1, windowStart: now })
    } else {
      entry.count++
    }
  }
}
