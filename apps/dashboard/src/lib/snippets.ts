export const HERO_SNIPPET = `import { tollMiddleware } from "@rajkaria123/toll-gateway"

app.use("/mcp", tollMiddleware({
  payTo: "G...YOUR_STELLAR_ADDRESS",
  tools: {
    search:    { price: "0.01" },
    analyze:   { price: "0.02" },
    compare:   { price: "0.05" },
  }
}))`

export const BEFORE_SNIPPET = `import express from "express"

const app = express()
app.use(express.json())

// Your MCP server — handles tool calls
app.post("/mcp", async (req, res) => {
  await mcpServer.handle(req, res)
})

app.listen(3000)`

export const AFTER_SNIPPET = `import express from "express"
import { tollMiddleware } from "@rajkaria123/toll-gateway"

const app = express()
app.use(express.json())

// One line. Every paid tool call now earns USDC.
app.use("/mcp", tollMiddleware({
  payTo: "G...YOUR_STELLAR_ADDRESS",
  tools: { search: { price: "0.01" }, analyze: { price: "0.05" } },
}))

app.post("/mcp", async (req, res) => {
  await mcpServer.handle(req, res)
})

app.listen(3000)`

export const QUICK_START_SNIPPET = `import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig, createHealthRoutes } from "@rajkaria123/toll-gateway"

const config = loadConfig("./toll.config.json")
const app = express()

app.use(express.json())
app.use("/mcp", tollMiddleware(config))    // paywall + spending policy
app.use(createHealthRoutes(config))        // /health, /health/tools, /cost

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(3002)`

export const TOLL_CONFIG_SNIPPET = `{
  "network": "mainnet",
  "payTo": "G...YOUR_STELLAR_ADDRESS",
  "facilitatorUrl": "https://channels.openzeppelin.com/x402",
  "tools": {
    "my_free_tool":   { "price": "0",    "currency": "USDC" },
    "my_paid_tool":   { "price": "0.05", "currency": "USDC" }
  }
}`

export const CONNECT_SNIPPET = `// Claude Desktop / any MCP client config
{
  "mcpServers": {
    "watchdog": {
      "url": "https://api.tollpay.xyz/mcp",
      "transport": "streamable-http"
    }
  }
}`

export const SDK_SNIPPET = `import { TollClient } from "@rajkaria123/toll-sdk"

const toll = new TollClient({
  serverUrl: "https://api.tollpay.xyz",
  secretKey: "S...",
  budget: { maxPerCall: "0.10", maxDaily: "5.00" },
})

// Auto-handles 402 -> sign -> retry
const result = await toll.callTool("search_competitors", { query: "CRM" })
console.log(result.data)          // tool output
console.log(toll.getSpending())   // { totalSpent: 0.01, ... }`

export const CLI_SNIPPET = `# Initialize a new Toll project
npx @rajkaria123/toll-cli init

# Check configuration and pricing
npx @rajkaria123/toll-cli status

# Register your server in the Toll Registry
npx @rajkaria123/toll-cli register --url https://your-server.com/mcp`

export const PROXY_SNIPPET = `# Start the Toll Proxy — auto-creates a Stellar wallet
npx @rajkaria123/toll-proxy --target https://api.tollpay.xyz/mcp

# Or with custom budget limits
npx @rajkaria123/toll-proxy \\
  --target https://api.tollpay.xyz/mcp \\
  --budget-daily 5.00 \\
  --budget-per-call 0.50`

export const PROXY_CONFIG_SNIPPET = `// Add to Claude Desktop / Cursor MCP config:
{
  "mcpServers": {
    "my-paid-tools": {
      "url": "http://localhost:3010/mcp?target=https://api.tollpay.xyz/mcp",
      "transport": "streamable-http"
    }
  }
}`

export const REGISTRY_SNIPPET = `// Discover tools programmatically
const resp = await fetch(
  "https://tollpay.xyz/api/registry/discover?q=search&maxPrice=0.05"
)
const { tools } = await resp.json()
// [{ name: "search_competitors", price: "0.01", server: { url: "..." }, ... }]`

export const WALLET_SNIPPET = `import { WalletManager } from "@rajkaria123/toll-sdk"

const wallet = new WalletManager()

// Auto-creates ~/.toll/wallet.json with a Stellar Ed25519 keypair
const { publicKey, secretKey } = wallet.getOrCreate("mainnet")

// Get funding instructions
console.log(wallet.fundingInstructions(publicKey))`

export const GETTING_STARTED_SNIPPET = `// 1. Install
// npm install @rajkaria123/toll-sdk

// 2. Create a wallet (saved to ~/.toll/wallet.json)
import { WalletManager, TollClient } from "@rajkaria123/toll-sdk"

const wm = new WalletManager()
const wallet = wm.getOrCreate("mainnet")
console.log("Your address:", wallet.publicKey)
// → Fund this address with USDC on Stellar mainnet
//   (send to USDC asset: CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI)
//   Minimum: 0.05 USDC for 5 test calls at api.tollpay.xyz

// 3. Call a paid tool — auto-signs the 402 and pays
const toll = new TollClient({
  serverUrl: "https://api.tollpay.xyz",
  secretKey: wallet.secretKey,
  budget: { maxPerCall: "0.05", maxDaily: "1.00" },
})

const result = await toll.callTool("search_competitors", { query: "project management" })
if (result.success) {
  console.log(result.data)          // tool output
  console.log(result.paid)          // true — 0.01 USDC paid on Stellar mainnet
}

console.log(toll.getSpending())
// { totalSpent: 0.01, callCount: 1, dailyRemaining: 0.99 }`
