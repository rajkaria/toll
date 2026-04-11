import "dotenv/config"
import express from "express"
import cors from "cors"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig, withToll } from "@rajkaria123/toll-gateway"
import { EarningsTracker } from "@rajkaria123/toll-stellar"
import { createMcpServer } from "./server.js"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT ?? "3002", 10)

async function main() {
  const configPath = path.resolve(__dirname, "..", "toll.config.json")
  const config = loadConfig(configPath)

  const app = express()
  app.use(cors())
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

  // Earnings API — exposes EarningsTracker data for the remote dashboard
  const earnings = new EarningsTracker(config.dataDir)

  app.get("/api/v1/earnings", (_req, res) => {
    try {
      const data = earnings.getFullEarningsData()
      res.json(data)
    } catch (err) {
      console.error("[Toll] Earnings API error:", err)
      res.status(500).json({ error: "Failed to fetch earnings data" })
    }
  })

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "Watchdog Lite", version: "0.1.0", network: config.network })
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
