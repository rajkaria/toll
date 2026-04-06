export const QUICK_START_SNIPPET = `import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig, createHealthRoutes } from "@toll/gateway"

const config = loadConfig("./toll.config.json")
const app = express()

app.use(express.json())
app.use(tollMiddleware(config))           // payment + spending policy
app.use(createHealthRoutes(config))       // /health, /health/tools, /cost

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
  },
  "spendingPolicy": {
    "maxPerCall": "0.10",
    "maxDailyPerCaller": "1.00",
    "maxDailyGlobal": "10.00"
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

export const SDK_SNIPPET = `import { TollClient } from "@toll/sdk"

const toll = new TollClient({
  serverUrl: "http://localhost:3002",
  secretKey: "S...",
  budget: { maxPerCall: "0.10", maxDaily: "5.00" },
})

// Auto-handles 402 → sign → retry
const result = await toll.callTool("search_competitors", { query: "CRM" })
console.log(result.data)          // tool output
console.log(toll.getSpending())   // { totalSpent: 0.01, ... }`

export const CLI_SNIPPET = `# Initialize a new Toll project
npx @toll/cli init

# Check configuration and pricing
npx @toll/cli status`
