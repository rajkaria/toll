export class ProxyBudgetTracker {
  private dailySpent = 0
  private dailyResetAt: number
  private perCallMax: number | null
  private dailyMax: number | null

  constructor(budget: { maxPerCall?: string; maxDaily?: string }) {
    this.perCallMax = budget.maxPerCall ? parseFloat(budget.maxPerCall) : null
    this.dailyMax = budget.maxDaily ? parseFloat(budget.maxDaily) : null
    this.dailyResetAt = this.endOfDay()
  }

  check(price: number): { allowed: boolean; reason?: string } {
    this.resetIfNeeded()

    if (this.perCallMax !== null && price > this.perCallMax) {
      return { allowed: false, reason: `Per-call limit exceeded: $${price} > $${this.perCallMax}` }
    }
    if (this.dailyMax !== null && this.dailySpent + price > this.dailyMax) {
      return {
        allowed: false,
        reason: `Daily budget exceeded: $${(this.dailySpent + price).toFixed(4)} > $${this.dailyMax}`,
      }
    }
    return { allowed: true }
  }

  record(amount: number): void {
    this.resetIfNeeded()
    this.dailySpent += amount
  }

  getReport() {
    this.resetIfNeeded()
    return {
      dailySpent: this.dailySpent,
      dailyRemaining: this.dailyMax !== null ? Math.max(0, this.dailyMax - this.dailySpent) : null,
      dailyMax: this.dailyMax,
      perCallMax: this.perCallMax,
    }
  }

  private resetIfNeeded(): void {
    if (Date.now() > this.dailyResetAt) {
      this.dailySpent = 0
      this.dailyResetAt = this.endOfDay()
    }
  }

  private endOfDay(): number {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d.getTime()
  }
}
