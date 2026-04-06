/**
 * Revenue Share Contract — distributes payments among multiple recipients.
 * In production, this would be a Soroban smart contract.
 * This is the TypeScript interface + in-memory mock.
 */

export interface RevenueSplit {
  address: string
  percent: number // 0-100, all splits must sum to 100
}

export interface RevenueShareContract {
  initialize(splits: RevenueSplit[]): void
  distribute(amount: number, asset: string): Promise<Record<string, number>>
  getBalances(): Record<string, number>
  withdraw(address: string): Promise<number>
  getSplits(): RevenueSplit[]
}

export class MockRevenueShare implements RevenueShareContract {
  private splits: RevenueSplit[] = []
  private balances = new Map<string, number>()

  initialize(splits: RevenueSplit[]): void {
    const total = splits.reduce((s, sp) => s + sp.percent, 0)
    if (Math.abs(total - 100) > 0.01) throw new Error(`Splits must sum to 100, got ${total}`)
    this.splits = splits
    for (const s of splits) {
      if (!this.balances.has(s.address)) this.balances.set(s.address, 0)
    }
  }

  async distribute(amount: number): Promise<Record<string, number>> {
    const distributions: Record<string, number> = {}
    for (const split of this.splits) {
      const share = (amount * split.percent) / 100
      this.balances.set(split.address, (this.balances.get(split.address) ?? 0) + share)
      distributions[split.address] = share
    }
    return distributions
  }

  getBalances(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const [addr, bal] of this.balances) out[addr] = bal
    return out
  }

  async withdraw(address: string): Promise<number> {
    const balance = this.balances.get(address) ?? 0
    this.balances.set(address, 0)
    return balance
  }

  getSplits(): RevenueSplit[] {
    return [...this.splits]
  }
}
