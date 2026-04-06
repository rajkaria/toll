/** Stellar Anchor — SEP-24 fiat on/off-ramp */
export interface AnchorProvider {
  initiateDeposit(amount: string, currency: string): Promise<{ id: string; url: string; status: string }>
  initiateWithdraw(amount: string, currency: string, destination: string): Promise<{ id: string; status: string }>
  getTransaction(id: string): Promise<{ id: string; status: string; amount?: string }>
}

export class StubAnchorProvider implements AnchorProvider {
  async initiateDeposit(amount: string, currency: string) {
    return { id: `dep-${Date.now()}`, url: "https://demo.anchor.stellar.org/sep24/deposit", status: "pending", amount, currency }
  }
  async initiateWithdraw(amount: string, currency: string) {
    return { id: `wd-${Date.now()}`, status: "pending", amount, currency }
  }
  async getTransaction(id: string) {
    return { id, status: "completed", amount: "10.00" }
  }
}
