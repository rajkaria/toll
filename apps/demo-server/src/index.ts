import "dotenv/config"
import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig, withToll } from "@toll/gateway"
import { createMcpServer } from "./server.js"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT ?? "3002", 10)

async function main() {
  const configPath = path.resolve(__dirname, "..", "toll.config.json")
  const config = loadConfig(configPath)

  const app = express()
  app.use(express.json())

  // Apply Toll payment gateway middleware
  app.use("/mcp", tollMiddleware(config))

  // MCP over HTTP transport — stateless mode, fresh server per request
  app.post("/mcp", async (req, res) => {
    const mcpServer = createMcpServer()
    withToll(mcpServer, config)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, req.body)
  })

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "Watchdog Lite", version: "0.1.0" })
  })

  app.listen(PORT, () => {
    console.log(`Watchdog Lite MCP server running on port ${PORT}`)
    console.log(`  Endpoint: http://localhost:${PORT}/mcp`)
    console.log(`  Network:  ${config.network}`)
    console.log(`  Pay to:   ${config.payTo}`)
    console.log(`  Tools:`)
    for (const [name, toolCfg] of Object.entries(config.tools)) {
      const price = parseFloat(toolCfg.price) === 0 ? "FREE" : `$${toolCfg.price} USDC (${toolCfg.paymentMode ?? config.defaultPaymentMode})`
      console.log(`    ${name}: ${price}`)
    }
  })
}

main().catch((err) => {
  console.error("Failed to start server:", err)
  process.exit(1)
})
