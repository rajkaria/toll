import type { TollConfig } from "@toll/stellar"

/**
 * SpendingPolicy — Toll's trust primitive.
 *
 * Enforces budget caps and access controls BEFORE payment verification.
 * This is the answer to "why should I trust this with real money?"
 *
 * Policies are checked in order:
 * 1. Caller allowlist/blocklist (if configured)
 * 2. Per-call maximum (rejects overly expensive calls)
 * 3. Daily budget cap per caller
 * 4. Global daily budget cap across all callers
 */

export interface SpendingPolicyConfig {
  /** Max USDC a single call can cost. Rejects tools priced above this. */
  maxPerCall?: string
  /** Max USDC a single caller can spend per day */
  maxDailyPerCaller?: string
  /** Max USDC total across all callers per day */
  maxDailyGlobal?: string
  /** Stellar addresses allowed to call paid tools (empty = allow all) */
  allowedCallers?: string[]
  /** Stellar addresses blocked from calling paid tools */
  blockedCallers?: string[]
}

interface DailySpend {
  amount: number
  dayStart: number
}

export class SpendingPolicy {
  private config: SpendingPolicyConfig
  private perCallerSpend = new Map<string, DailySpend>()
  private globalSpend: DailySpend = { amount: 0, dayStart: this.todayStart() }

  constructor(config: SpendingPolicyConfig) {
    this.config = config
  }

  /**
   * Check if a call is allowed under current spending policies.
   * Returns null if allowed, or an error string if rejected.
   */
  check(callerId: string, toolPrice: string): string | null {
    const price = parseFloat(toolPrice)
    if (price === 0) return null // free tools always pass

    // 1. Caller allowlist
    if (this.config.allowedCallers?.length) {
      if (!this.config.allowedCallers.includes(callerId)) {
        return `Caller not in allowlist`
      }
    }

    // 2. Caller blocklist
    if (this.config.blockedCallers?.includes(callerId)) {
      return `Caller is blocked`
    }

    // 3. Per-call maximum
    if (this.config.maxPerCall) {
      const max = parseFloat(this.config.maxPerCall)
      if (price > max) {
        return `Tool price $${toolPrice} exceeds per-call limit of $${this.config.maxPerCall}`
      }
    }

    // 4. Daily per-caller budget
    if (this.config.maxDailyPerCaller) {
      const max = parseFloat(this.config.maxDailyPerCaller)
      const spent = this.getCallerSpend(callerId)
      if (spent + price > max) {
        return `Caller daily budget exhausted ($${spent.toFixed(4)} of $${this.config.maxDailyPerCaller} used)`
      }
    }

    // 5. Global daily budget
    if (this.config.maxDailyGlobal) {
      const max = parseFloat(this.config.maxDailyGlobal)
      const spent = this.getGlobalSpend()
      if (spent + price > max) {
        return `Global daily budget exhausted ($${spent.toFixed(4)} of $${this.config.maxDailyGlobal} used)`
      }
    }

    return null
  }

  /** Record a successful spend */
  record(callerId: string, amount: number): void {
    const today = this.todayStart()

    // Per-caller
    const callerEntry = this.perCallerSpend.get(callerId)
    if (!callerEntry || callerEntry.dayStart !== today) {
      this.perCallerSpend.set(callerId, { amount, dayStart: today })
    } else {
      callerEntry.amount += amount
    }

    // Global
    if (this.globalSpend.dayStart !== today) {
      this.globalSpend = { amount, dayStart: today }
    } else {
      this.globalSpend.amount += amount
    }
  }

  /** Get current daily spend for a caller */
  getCallerSpend(callerId: string): number {
    const entry = this.perCallerSpend.get(callerId)
    if (!entry || entry.dayStart !== this.todayStart()) return 0
    return entry.amount
  }

  /** Get current global daily spend */
  getGlobalSpend(): number {
    if (this.globalSpend.dayStart !== this.todayStart()) return 0
    return this.globalSpend.amount
  }

  private todayStart(): number {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
}

/** Extract spending policy from TollConfig */
export function getSpendingPolicy(config: TollConfig): SpendingPolicy {
  return new SpendingPolicy(config.spendingPolicy ?? {})
}
