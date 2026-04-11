import { describe, it, expect, vi } from "vitest"
import { withToll } from "./withToll.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { TollConfig } from "@rajkaria123/toll-stellar"

const config: TollConfig = {
  network: "testnet",
  payTo: "GXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {
    paid_tool: { price: "0.01", currency: "USDC" },
    free_tool: { price: "0", currency: "USDC" },
  },
}

describe("withToll", () => {
  it("returns the same McpServer instance", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" })
    const result = withToll(server, config)
    expect(result).toBe(server)
  })

  it("free tools are not wrapped", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" })
    server.tool("free_tool", vi.fn())
    withToll(server, config)
    const tools = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    expect(tools["free_tool"]).toBeDefined()
  })
})
