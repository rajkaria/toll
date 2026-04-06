/** Stellar Turrets — serverless execution for tool functions */
export interface TurretProvider {
  uploadFunction(wasm: Buffer): Promise<{ id: string; fee: string }>
  runFunction(id: string, args: unknown): Promise<unknown>
  getFee(id: string): Promise<string>
}

export class StubTurretProvider implements TurretProvider {
  async uploadFunction(): Promise<{ id: string; fee: string }> {
    throw new Error("Turrets not configured. See: https://tss.stellar.org/")
  }
  async runFunction(): Promise<unknown> {
    throw new Error("Turrets not configured")
  }
  async getFee(): Promise<string> {
    throw new Error("Turrets not configured")
  }
}
