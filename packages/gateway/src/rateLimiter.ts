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

  private getWindowMs(toolConfig: TollToolConfig): number {
    return toolConfig.rateLimit?.perHour ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  }

  isWithinFreeTier(callerId: string, tool: string, toolConfig: TollToolConfig): boolean {
    if (!toolConfig.rateLimit) return false

    const { free } = toolConfig.rateLimit
    const key = this.key(callerId, tool)
    const now = Date.now()
    const windowMs = this.getWindowMs(toolConfig)

    const entry = this.usage.get(key)
    if (!entry || now - entry.windowStart > windowMs) {
      return true
    }

    return entry.count < free
  }

  increment(callerId: string, tool: string, toolConfig: TollToolConfig): void {
    const key = this.key(callerId, tool)
    const now = Date.now()
    const entry = this.usage.get(key)
    const windowMs = this.getWindowMs(toolConfig)

    if (!entry || now - entry.windowStart > windowMs) {
      this.usage.set(key, { count: 1, windowStart: now })
    } else {
      entry.count++
    }
  }
}
