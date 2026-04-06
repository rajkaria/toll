/**
 * Escrow Contract — holds funds until conditions are met or timeout.
 * For high-value tool calls. In production, deployed as Soroban contract.
 */

export type EscrowStatus = "created" | "funded" | "released" | "disputed" | "refunded" | "expired"

export interface EscrowState {
  id: string
  buyer: string
  seller: string
  amount: number
  asset: string
  status: EscrowStatus
  createdAt: number
  expiresAt: number
  toolName: string
  disputeReason?: string
}

export interface EscrowContract {
  create(buyer: string, seller: string, amount: number, asset: string, toolName: string, timeoutSeconds: number): Promise<EscrowState>
  release(id: string): Promise<EscrowState>
  dispute(id: string, reason: string): Promise<EscrowState>
  refund(id: string): Promise<EscrowState>
  getStatus(id: string): EscrowState | null
  listActive(): EscrowState[]
}

export class MockEscrow implements EscrowContract {
  private escrows = new Map<string, EscrowState>()

  async create(buyer: string, seller: string, amount: number, asset: string, toolName: string, timeoutSeconds: number): Promise<EscrowState> {
    const id = `escrow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const state: EscrowState = {
      id, buyer, seller, amount, asset, toolName,
      status: "funded",
      createdAt: Date.now(),
      expiresAt: Date.now() + timeoutSeconds * 1000,
    }
    this.escrows.set(id, state)
    return state
  }

  async release(id: string): Promise<EscrowState> {
    const e = this.escrows.get(id)
    if (!e) throw new Error("Escrow not found")
    if (e.status !== "funded") throw new Error(`Cannot release: status is ${e.status}`)
    e.status = "released"
    return e
  }

  async dispute(id: string, reason: string): Promise<EscrowState> {
    const e = this.escrows.get(id)
    if (!e) throw new Error("Escrow not found")
    if (e.status !== "funded") throw new Error(`Cannot dispute: status is ${e.status}`)
    e.status = "disputed"
    e.disputeReason = reason
    return e
  }

  async refund(id: string): Promise<EscrowState> {
    const e = this.escrows.get(id)
    if (!e) throw new Error("Escrow not found")
    if (e.status !== "disputed") throw new Error(`Cannot refund: status is ${e.status}`)
    e.status = "refunded"
    return e
  }

  getStatus(id: string): EscrowState | null {
    return this.escrows.get(id) ?? null
  }

  listActive(): EscrowState[] {
    return [...this.escrows.values()].filter((e) => e.status === "funded" && e.expiresAt > Date.now())
  }
}
