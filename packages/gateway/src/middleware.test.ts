import { describe, it, expect, vi, beforeEach } from "vitest"
import { tollMiddleware } from "./middleware.js"
import type { TollConfig } from "@toll/stellar"

// Mock @toll/stellar modules
vi.mock("@toll/stellar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@toll/stellar")>()
  return {
    ...actual,
    X402Verifier: vi.fn().mockImplementation(() => ({
      buildRequirements: vi.fn().mockReturnValue({ x402Version: 2, accepts: [] }),
      encodeRequirements: vi.fn().mockReturnValue("base64reqs"),
      settle: vi.fn().mockResolvedValue({ success: true, transaction: "txhash", payer: "GPAYER" }),
    })),
    MPPVerifier: vi.fn().mockImplementation(() => ({
      createMiddleware: vi.fn().mockReturnValue(
        (_req: unknown, _res: unknown, next: () => void) => next()
      ),
    })),
    EarningsTracker: vi.fn().mockImplementation(() => ({
      record: vi.fn(),
      getStats: vi.fn().mockReturnValue({ totalEarnings: 0, totalCalls: 0, todayEarnings: 0, todayCalls: 0 }),
    })),
  }
})

function makeReqRes(
  method = "tools/call",
  toolName = "search_competitors",
  headers: Record<string, string> = {}
) {
  return {
    req: {
      body: { jsonrpc: "2.0", id: "1", method, params: { name: toolName, arguments: {} } },
      headers,
      ip: "127.0.0.1",
      protocol: "http",
      get: (h: string) => (h === "host" ? "localhost:3002" : undefined),
      path: "/mcp",
    },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    },
    next: vi.fn(),
  }
}

const config: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {
    search_competitors: { price: "0.01", currency: "USDC" },
    health_check: { price: "0", currency: "USDC" },
  },
}

describe("tollMiddleware", () => {
  it("passes free tools directly to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "health_check")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it("passes unknown tools to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "unknown_tool")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })

  it("returns 402 for paid tools without payment header", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "search_competitors")
    await middleware(req as never, res as never, next)
    expect(res.status).toHaveBeenCalledWith(402)
    expect(res.json).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("calls next() for paid tools with valid payment header", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "search_competitors", {
      "payment-signature": "validpayload",
    })
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })

  it("passes non-tool-call requests to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/list", "")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })
})
