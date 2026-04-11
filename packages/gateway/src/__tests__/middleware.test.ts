import { describe, it, expect, vi, beforeEach } from "vitest"
import express from "express"
import request from "supertest"
import { tollMiddleware } from "../middleware.js"
import type { TollConfig } from "@rajkaria123/toll-stellar"

// Mock the stellar package
vi.mock("@rajkaria123/toll-stellar", () => ({
  X402Verifier: vi.fn().mockImplementation(() => ({
    buildRequirements: vi.fn().mockReturnValue({
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "stellar:testnet",
          asset: "USDC",
          payTo: "GTEST1234567890123456789012345678901234567890123456",
          amount: "10000",
          maxTimeoutSeconds: 60,
        },
      ],
    }),
    encodeRequirements: vi.fn().mockReturnValue("base64encoded"),
    settle: vi.fn().mockResolvedValue({
      success: true,
      transaction: "txhash123",
      payer: "GPAYER123456789012345678901234567890123456789012345",
    }),
  })),
  MPPVerifier: vi.fn().mockImplementation(() => ({
    handleCharge: vi.fn().mockResolvedValue({ paid: false }),
  })),
  EarningsTracker: vi.fn().mockImplementation(() => ({
    record: vi.fn(),
  })),
}))

// Mock internal dependencies that touch filesystem or have side effects
vi.mock("../rateLimiter.js", () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    isWithinFreeTier: vi.fn().mockReturnValue(false),
    increment: vi.fn(),
  })),
}))

vi.mock("../spendingPolicy.js", () => ({
  SpendingPolicy: vi.fn().mockImplementation(() => ({
    check: vi.fn().mockReturnValue(null),
    record: vi.fn(),
  })),
}))

function createApp(config: TollConfig) {
  const app = express()
  app.use(express.json())
  app.use("/mcp", tollMiddleware(config))
  app.post("/mcp", (_req, res) => res.json({ result: "ok" }))
  return app
}

const baseConfig: TollConfig = {
  network: "testnet",
  payTo: "GTEST1234567890123456789012345678901234567890123456",
  facilitatorUrl: "https://test-facilitator.example.com",
  defaultPaymentMode: "x402",
  tools: {
    health_check: { price: "0", currency: "USDC" },
    search: { price: "0.01", currency: "USDC" },
  },
}

function mcpToolCall(name: string, args: Record<string, unknown> = {}) {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  }
}

describe("tollMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Free tool passthrough ---
  it("passes through free tools without requiring payment", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send(mcpToolCall("health_check"))

    expect(res.status).toBe(200)
    expect(res.body.result).toBe("ok")
  })

  // --- Unknown tool passthrough ---
  it("passes through tools not listed in config", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send(mcpToolCall("unknown_tool"))

    expect(res.status).toBe(200)
    expect(res.body.result).toBe("ok")
  })

  // --- Paid tool returns 402 without payment header ---
  it("returns 402 for paid tools when no payment-signature header is present", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send(mcpToolCall("search"))

    expect(res.status).toBe(402)
    expect(res.body.x402Version).toBe(2)
    expect(res.body.accepts).toBeDefined()
    expect(res.body["payment-required"]).toBe("base64encoded")
  })

  // --- Invalid tool name rejected ---
  it("rejects tool names with special characters (400)", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send(mcpToolCall("tool;rm -rf"))

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Invalid tool name")
  })

  it("rejects tool names with path traversal characters (400)", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send(mcpToolCall("../../etc/passwd"))

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Invalid tool name")
  })

  // --- Non-MCP requests pass through ---
  it("passes through non-tool-call MCP methods (e.g. tools/list)", async () => {
    const app = createApp(baseConfig)
    const res = await request(app)
      .post("/mcp")
      .send({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })

    expect(res.status).toBe(200)
    expect(res.body.result).toBe("ok")
  })

  it("passes through plain POST bodies that are not JSON-RPC", async () => {
    const app = createApp(baseConfig)
    const res = await request(app).post("/mcp").send({ hello: "world" })

    expect(res.status).toBe(200)
    expect(res.body.result).toBe("ok")
  })

  // --- Replay protection ---
  it("rejects a reused payment signature on the second request", async () => {
    const app = createApp(baseConfig)

    // First request with payment-signature succeeds (settle returns success)
    const res1 = await request(app)
      .post("/mcp")
      .set("payment-signature", "sig-unique-abc123")
      .send(mcpToolCall("search"))

    expect(res1.status).toBe(200)
    expect(res1.body.result).toBe("ok")

    // Second request with the same signature is rejected
    const res2 = await request(app)
      .post("/mcp")
      .set("payment-signature", "sig-unique-abc123")
      .send(mcpToolCall("search"))

    expect(res2.status).toBe(402)
    expect(res2.body.error).toContain("already used")
  })

  // --- Paid tool with valid payment passes through ---
  it("allows paid tool when valid payment-signature is provided", async () => {
    const app = createApp(baseConfig)
    const res = await request(app)
      .post("/mcp")
      .set("payment-signature", "valid-sig-xyz")
      .send(mcpToolCall("search"))

    expect(res.status).toBe(200)
    expect(res.body.result).toBe("ok")
  })
})
