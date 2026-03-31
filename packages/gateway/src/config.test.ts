import { describe, it, expect } from "vitest"
import { validateConfig } from "./config.js"

describe("validateConfig", () => {
  const validConfig = {
    network: "testnet",
    payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    facilitatorUrl: "http://localhost:3001",
    defaultPaymentMode: "x402",
    tools: {
      search_competitors: { price: "0.01", currency: "USDC" },
      health_check: { price: "0", currency: "USDC" },
    },
  }

  it("accepts a valid config", () => {
    const result = validateConfig(validConfig)
    expect(result.network).toBe("testnet")
    expect(result.tools.search_competitors.price).toBe("0.01")
  })

  it("throws on invalid network", () => {
    expect(() => validateConfig({ ...validConfig, network: "invalid" })).toThrow()
  })

  it("throws on missing payTo", () => {
    const { payTo: _, ...rest } = validConfig
    expect(() => validateConfig(rest)).toThrow()
  })

  it("identifies free tools", () => {
    const result = validateConfig(validConfig)
    expect(parseFloat(result.tools.health_check.price)).toBe(0)
  })
})
