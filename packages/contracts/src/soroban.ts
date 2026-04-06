/**
 * Soroban Payment Contract — direct payment verification on Stellar.
 * In production, verifies transactions directly on-chain instead of via facilitator.
 */

export interface PaymentRecord {
  txHash: string
  buyer: string
  seller: string
  amount: string
  asset: string
  toolHash: string
  timestamp: number
  verified: boolean
}

export interface SorobanPaymentContract {
  pay(buyer: string, seller: string, amount: string, toolHash: string): Promise<PaymentRecord>
  verify(txHash: string): Promise<{ verified: boolean; record?: PaymentRecord }>
  getPaymentStatus(txHash: string): PaymentRecord | null
}

export class MockSorobanPayment implements SorobanPaymentContract {
  private payments = new Map<string, PaymentRecord>()

  async pay(buyer: string, seller: string, amount: string, toolHash: string): Promise<PaymentRecord> {
    const txHash = `mock-tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const record: PaymentRecord = {
      txHash, buyer, seller, amount, asset: "USDC", toolHash,
      timestamp: Date.now(), verified: true,
    }
    this.payments.set(txHash, record)
    return record
  }

  async verify(txHash: string): Promise<{ verified: boolean; record?: PaymentRecord }> {
    const record = this.payments.get(txHash)
    if (!record) return { verified: false }
    return { verified: true, record }
  }

  getPaymentStatus(txHash: string): PaymentRecord | null {
    return this.payments.get(txHash) ?? null
  }
}
