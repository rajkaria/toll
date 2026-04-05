import { describe, it, expect } from "vitest"
import { MPPVerifier } from "./verifier.js"
import type { TollConfig } from "../types.js"

const mockConfig: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "https://x402.org/facilitator",
  defaultPaymentMode: "mpp",
  tools: {},
  mpp: { enabled: true },
}

describe("MPPVerifier", () => {
  it("constructs with config and secret key", () => {
    const v = new MPPVerifier(mockConfig, "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    expect(v).toBeDefined()
  })

  it("throws when secret key is missing and handleCharge called", async () => {
    const v = new MPPVerifier(mockConfig) // no secret key, no env var
    const originalEnv = process.env.TOLL_SERVER_SECRET
    delete process.env.TOLL_SERVER_SECRET

    const result = await v.handleCharge(
      { headers: {}, method: "POST", url: "/mcp", protocol: "http" },
      "test_tool",
      "0.05"
    ).catch((err) => ({ paid: false, error: String(err) }))

    expect(result.paid).toBe(false)
    expect(result.error).toContain("TOLL_SERVER_SECRET")

    // Restore
    if (originalEnv) process.env.TOLL_SERVER_SECRET = originalEnv
  })
})
