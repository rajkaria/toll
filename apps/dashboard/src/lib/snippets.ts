export const QUICK_START_SNIPPET = `import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig } from "@toll/gateway"

const config = loadConfig("./toll.config.json")
const app = express()

app.use(express.json())
app.use("/mcp", tollMiddleware(config))  // payment enforcement

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(3002)`

export const TOLL_CONFIG_SNIPPET = `{
  "network": "testnet",
  "payTo": "G...YOUR_STELLAR_ADDRESS",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": {
    "my_free_tool":   { "price": "0",    "currency": "USDC" },
    "my_paid_tool":   { "price": "0.05", "currency": "USDC" },
    "my_mpp_tool":    { "price": "0.10", "currency": "USDC", "paymentMode": "mpp" }
  }
}`

export const CONNECT_SNIPPET = `// In your MCP client config (e.g. Claude Desktop)
{
  "mcpServers": {
    "watchdog-lite": {
      "url": "http://localhost:3002/mcp",
      "transport": "streamable-http"
    }
  }
}`
