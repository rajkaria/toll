export interface RateLimiting402Config {
  max402PerMinute?: number // default 30
  burstWindow?: number // ms, default 60000
  backoffMultiplier?: number // default 2
}

interface CallerState {
  count: number
  windowStart: number
  consecutiveBursts: number
}

export class RateLimiter402 {
  private callers = new Map<string, CallerState>()
  private maxPerWindow: number
  private windowMs: number
  private backoffMultiplier: number

  constructor(config?: RateLimiting402Config) {
    this.maxPerWindow = config?.max402PerMinute ?? 30
    this.windowMs = config?.burstWindow ?? 60_000
    this.backoffMultiplier = config?.backoffMultiplier ?? 2
  }

  /**
   * Check if a 402 response is allowed for this caller.
   * Returns { allowed, retryAfter? (seconds) }
   */
  check(callerId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now()
    const state = this.callers.get(callerId)

    if (!state || now - state.windowStart > this.windowMs) {
      this.callers.set(callerId, { count: 1, windowStart: now, consecutiveBursts: 0 })
      return { allowed: true }
    }

    if (state.count >= this.maxPerWindow) {
      // Exponential backoff
      const backoffSec = Math.pow(this.backoffMultiplier, state.consecutiveBursts) * (this.windowMs / 1000)
      state.consecutiveBursts++
      return { allowed: false, retryAfter: Math.ceil(backoffSec) }
    }

    state.count++
    return { allowed: true }
  }

  /** Record a 402 response for rate limiting */
  record(callerId: string): void {
    const state = this.callers.get(callerId)
    if (state) state.count++
  }
}
