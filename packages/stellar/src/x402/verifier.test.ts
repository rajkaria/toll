import { describe, it, expect, vi, beforeEach } from "vitest"
import { X402Verifier } from "./verifier.js"
import type { TollConfig } from "../types.js"

const mockConfig: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {},
}

describe("X402Verifier", () => {
  it("toUsdcBaseUnits converts correctly", () => {
    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    expect(reqs.x402Version).toBe(2)
    expect(reqs.accepts[0].amount).toBe("100000") // 0.01 * 10^7
    expect(reqs.accepts[0].scheme).toBe("exact")
    expect(reqs.accepts[0].network).toBe("stellar:testnet")
    expect(reqs.accepts[0].payTo).toBe(mockConfig.payTo)
  })

  it("settle calls facilitator /settle endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, transaction: "abc123", payer: "GPAYER..." }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    const result = await v.settle("base64payloadhere", reqs)

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/settle",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    )
    expect(result.success).toBe(true)
    expect(result.transaction).toBe("abc123")
  })

  it("settle returns failure on facilitator error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid payment" }),
    }))

    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    const result = await v.settle("badinput", reqs)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
