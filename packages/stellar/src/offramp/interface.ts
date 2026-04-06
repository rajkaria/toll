export interface OfframpProvider {
  /** Initiate a withdrawal to fiat */
  initiate(amount: string, currency: string, destination: string): Promise<{ id: string; status: string }>
  /** Check status of a withdrawal */
  getStatus(id: string): Promise<{ id: string; status: string; completedAt?: string }>
  /** List recent transfers */
  listTransfers(limit?: number): Promise<Array<{ id: string; amount: string; status: string; date: string }>>
}

/** Stub implementation — returns mock responses for demo/testing */
export class StubOfframpProvider implements OfframpProvider {
  async initiate(amount: string, currency: string, destination: string) {
    return { id: `offramp-${Date.now()}`, status: "pending", amount, currency, destination }
  }

  async getStatus(id: string) {
    return { id, status: "completed", completedAt: new Date().toISOString() }
  }

  async listTransfers() {
    return [{ id: "offramp-demo", amount: "10.00", status: "completed", date: new Date().toISOString() }]
  }
}
