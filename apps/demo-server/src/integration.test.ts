/**
 * Integration tests for the Toll demo server.
 *
 * These tests start an Express server in-process (no real Stellar payments)
 * and verify:
 *   1. FREE tools pass through without any payment header
 *   2. Paid tools (x402) return 402 with correct PaymentRequired JSON
 *   3. Paid tools (MPP) return 402 / WWW-Authenticate
 *   4. The /health HTTP endpoint returns ok
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { Server } from "node:http"
import { createMcpServer } from "./server.js"

// Minimal toll config for testing — no real Stellar keys needed
const TEST_CONFIG = {
  network: "testnet" as const,
  payTo: "GDUMMY000000000000000000000000000000000000000000000000000",
  facilitatorUrl: "https://x402.org/facilitator",
  defaultPaymentMode: "x402" as const,
  dataDir: "/tmp/toll-test",
  tools: {
    health_check: { price: "0", currency: "USDC" as const, description: "health" },
    search_competitors: { price: "0.01", currency: "USDC" as const, description: "search" },
    analyze_sentiment: { price: "0.02", currency: "USDC" as const, description: "sentiment" },
    compare_products: {
      price: "0.05",
      currency: "USDC" as const,
      paymentMode: "mpp" as const,
      description: "compare",
    },
  },
}

// --- Minimal inline toll middleware for test isolation ---
// We don't use the real tollMiddleware because it needs actual Stellar infra.
// Instead we inline a simplified version that just gates on payment headers.
import type { Request, Response, NextFunction } from "express"

function testTollMiddleware(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Record<string, unknown> | undefined
  if (!body || body.method !== "tools/call") {
    next()
    return
  }
  const toolName = (body.params as Record<string, unknown>)?.name as string | undefined
  if (!toolName) { next(); return }

  const toolCfg = TEST_CONFIG.tools[toolName as keyof typeof TEST_CONFIG.tools]
  if (!toolCfg || parseFloat(toolCfg.price) === 0) {
    next()
    return
  }

  const protocol = (toolCfg as Record<string, unknown>).paymentMode ?? TEST_CONFIG.defaultPaymentMode

  if (protocol === "mpp") {
    if (!req.headers["authorization"]) {
      res.status(402).json({ error: "MPP payment required", protocol: "mpp" })
      return
    }
    next()
    return
  }

  // x402
  if (!req.headers["payment-signature"]) {
    res.status(402).json({
      error: "x402 payment required",
      scheme: "exact",
      network: "stellar:testnet",
      maxAmountRequired: String(Math.round(parseFloat(toolCfg.price) * 1e7)),
      resource: `http://localhost/mcp`,
      description: toolCfg.description,
      mimeType: "application/json",
      payTo: TEST_CONFIG.payTo,
      maxTimeoutSeconds: 30,
      asset: "CBIELTK6YBZJU5UP2WWQEQPMBLOP6DE2MDGJYXU5WZXMGN5NQSRPDNX",
      "payment-required": Buffer.from(JSON.stringify({ price: toolCfg.price })).toString("base64"),
    })
    return
  }

  next()
}

// ---- Test server setup ----
let server: Server
let baseUrl: string

beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.use("/mcp", testTollMiddleware)

  app.post("/mcp", async (req, res) => {
    // Create a fresh McpServer per request (stateless mode — no session reuse)
    const requestServer = createMcpServer()
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    await requestServer.connect(transport)
    await transport.handleRequest(req, res, req.body)
  })

  app.get("/health", (_req, res) => res.json({ status: "ok" }))

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve())
  })

  const addr = server.address() as { port: number }
  baseUrl = `http://localhost:${addr.port}`
})

afterAll(() => {
  server?.close()
})

// ---- Helpers ----

/** Parse the first JSON data line from an SSE stream body */
async function parseSseJson(resp: Response): Promise<unknown> {
  const text = await resp.text()
  // SSE format: "event: message\ndata: {...}\n\n"
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (trimmed.startsWith("data:")) {
      const jsonStr = trimmed.slice(5).trim()
      if (jsonStr) return JSON.parse(jsonStr)
    }
  }
  return null
}

async function mcpCall(
  tool: string,
  args: Record<string, unknown>,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: unknown }> {
  const resp = await fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
  })

  // 402s come back as plain JSON (from our toll middleware, before the MCP transport)
  if (resp.status === 402) {
    return { status: 402, body: await resp.json() }
  }

  // 200 responses from the MCP transport are SSE
  const body = await parseSseJson(resp)
  return { status: resp.status, body }
}

// ---- Tests ----
describe("Toll demo server integration", () => {
  it("GET /health returns ok", async () => {
    const resp = await fetch(`${baseUrl}/health`)
    expect(resp.status).toBe(200)
    const body = await resp.json() as Record<string, unknown>
    expect(body.status).toBe("ok")
  })

  it("health_check tool is free (no payment required)", async () => {
    const { status, body } = await mcpCall("health_check", {})
    expect(status).toBe(200)
    expect((body as Record<string, unknown>)?.result).toBeDefined()
  })

  it("search_competitors requires x402 payment", async () => {
    const { status, body } = await mcpCall("search_competitors", { query: "pm tools" })
    expect(status).toBe(402)
    const b = body as Record<string, unknown>
    expect(b["payment-required"]).toBeDefined()
    expect(b.scheme).toBe("exact")
    expect(b.network).toBe("stellar:testnet")
  })

  it("search_competitors succeeds with payment-signature header", async () => {
    const fakeSignature = Buffer.from(JSON.stringify({ test: true })).toString("base64")
    const { status, body } = await mcpCall("search_competitors", { query: "pm tools" }, {
      "payment-signature": fakeSignature,
    })
    expect(status).toBe(200)
    expect((body as Record<string, unknown>)?.result).toBeDefined()
  })

  it("analyze_sentiment requires x402 payment", async () => {
    const { status, body } = await mcpCall("analyze_sentiment", { url: "https://example.com" })
    expect(status).toBe(402)
    const b = body as Record<string, unknown>
    expect(b.scheme).toBe("exact")
    expect(parseFloat(b.maxAmountRequired as string)).toBeGreaterThan(0)
  })

  it("compare_products requires MPP payment", async () => {
    const { status, body } = await mcpCall("compare_products", { product_a: "GitHub", product_b: "GitLab" })
    expect(status).toBe(402)
    expect((body as Record<string, unknown>).protocol).toBe("mpp")
  })

  it("compare_products succeeds with MPP Authorization header", async () => {
    const { status, body } = await mcpCall(
      "compare_products",
      { product_a: "GitHub", product_b: "GitLab" },
      { authorization: "Payment test-token" }
    )
    expect(status).toBe(200)
    expect((body as Record<string, unknown>)?.result).toBeDefined()
  })

  it("health_check tool returns expected server info", async () => {
    const { body } = await mcpCall("health_check", {})
    const result = (body as Record<string, unknown>)?.result as Record<string, unknown> | undefined
    const content = (result?.content as Array<{ text: string }>)?.[0]?.text
    expect(content).toBeDefined()
    const parsed = JSON.parse(content!) as Record<string, unknown>
    expect(parsed.status).toBe("ok")
    expect(parsed.server).toBe("Watchdog Lite")
  })

  it("search_competitors returns competitor data when paid", async () => {
    const fakeSignature = Buffer.from("{}").toString("base64")
    const { body } = await mcpCall("search_competitors", { query: "project management" }, {
      "payment-signature": fakeSignature,
    })
    const result = (body as Record<string, unknown>)?.result as Record<string, unknown> | undefined
    const content = (result?.content as Array<{ text: string }>)?.[0]?.text
    const parsed = JSON.parse(content!) as Record<string, unknown>
    expect(Array.isArray(parsed.results)).toBe(true)
    expect((parsed.results as unknown[]).length).toBeGreaterThan(0)
  })

  it("compare_products returns comparison when paid", async () => {
    const { body } = await mcpCall(
      "compare_products",
      { product_a: "GitHub", product_b: "GitLab" },
      { authorization: "Payment test" }
    )
    const result = (body as Record<string, unknown>)?.result as Record<string, unknown> | undefined
    const content = (result?.content as Array<{ text: string }>)?.[0]?.text
    const parsed = JSON.parse(content!) as Record<string, unknown>
    const comparison = parsed.comparison as Record<string, unknown>
    expect((comparison.product_a as Record<string, unknown>)?.name).toBe("GitHub")
    expect((comparison.product_b as Record<string, unknown>)?.name).toBe("GitLab")
  })
})
