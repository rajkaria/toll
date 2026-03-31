import { describe, it, expect } from "vitest"
import { MPPVerifier } from "./verifier.js"
import type { TollConfig } from "../types.js"

const mockConfig: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "mpp",
  tools: {},
  mpp: { enabled: true },
}

describe("MPPVerifier", () => {
  it("creates middleware function for a tool+price", () => {
    const v = new MPPVerifier(mockConfig)
    const middleware = v.createMiddleware("compare_products", "0.05")
    expect(typeof middleware).toBe("function")
    expect(middleware.length).toBe(3) // (req, res, next)
  })
})
