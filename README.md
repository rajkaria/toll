# Toll — MCP Monetization Gateway for Stellar

> Toll is a payment gateway that lets MCP (Model Context Protocol) server developers charge AI agents for tool usage using **x402** and **MPP** on **Stellar**.

Built for the [Stellar Hacks: Agents](https://stellar.org) hackathon — April 2026.

---

## What is this?

MCP servers expose tools to AI agents. Toll sits in front of your MCP server and enforces micropayments before tool calls execute — using Stellar's programmable payment protocols.

```
AI Agent  →  POST /mcp  →  Toll Gateway  →  MCP Server
                │                │
                │   [402 + PaymentRequired]
                │◄───────────────┘
                │
                │   [payment-signature header]
                ↓
              Stellar Testnet (USDC)
```

**Two payment protocols supported:**
- **x402** — HTTP 402 payment required header, Stellar transaction signed by agent, verified on-chain
- **MPP (Machine Payments Protocol)** — `WWW-Authenticate: Payment` header, Stellar smart contract channel

---

## Monorepo Structure

```
toll/
├── packages/
│   ├── stellar/          @toll/stellar  — x402 verifier, MPP verifier, EarningsTracker
│   └── gateway/          @toll/gateway  — tollMiddleware, withToll, config, RateLimiter
├── apps/
│   ├── demo-server/      Watchdog Lite MCP server (4 tools, real Claude API)
│   └── dashboard/        Next.js 15 earnings dashboard
└── scripts/
    ├── demo-agent.ts     CLI agent that pays for tool calls
    └── setup-wallet.ts   Testnet wallet setup + Friendbot funding
```

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Stellar testnet wallets

```bash
pnpm --filter toll-scripts exec tsx setup-wallet.ts
```

This generates two keypairs (server + agent), funds them via Friendbot, and prints the configuration.

### 3. Configure the demo server

Edit `apps/demo-server/toll.config.json`:
```json
{
  "payTo": "G<your-server-public-key>"
}
```

Create `apps/demo-server/.env`:
```
PORT=3002
TOLL_SERVER_SECRET=S<your-server-secret>
TOLL_SERVER_ADDRESS=G<your-server-public>
ANTHROPIC_API_KEY=sk-ant-...
TOLL_DATA_DIR=~/.toll
X402_FACILITATOR_URL=https://x402.org/facilitator
```

### 4. Start the demo server

```bash
pnpm --filter demo-server dev
```

### 5. Start the earnings dashboard

```bash
pnpm --filter dashboard dev
```

Open [http://localhost:3003](http://localhost:3003)

### 6. Run the demo agent

```bash
export AGENT_SECRET_KEY=S<agent-secret-key>
pnpm --filter toll-scripts exec tsx demo-agent.ts
```

---

## Demo Server Tools

| Tool | Price | Protocol | Description |
|------|-------|----------|-------------|
| `health_check` | FREE | — | Server status and version |
| `search_competitors` | $0.01 USDC | x402 | Competitor intelligence database |
| `analyze_sentiment` | $0.02 USDC | x402 | Sentiment analysis via Claude AI |
| `compare_products` | $0.05 USDC | MPP | Side-by-side product comparison |

---

## Payment Flow

### x402 (HTTP 402)

```
1. Agent POSTs tool call → Toll returns 402 with PaymentRequired JSON
2. Agent extracts requirements, signs Stellar transaction
3. Agent retries with payment-signature header (base64 tx)
4. Toll POSTs to facilitator /settle → verifies on-chain
5. Tool executes, earnings recorded
```

### MPP (Machine Payments Protocol)

```
1. Agent POSTs tool call → Toll returns 402 with MPP challenge
2. Agent signs payment via @stellar/mpp channel
3. Agent retries with Authorization: Payment header
4. Toll verifies payment via mppx middleware
5. Tool executes, earnings recorded
```

---

## Integration (Add Toll to Your Server)

```typescript
import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig, withToll } from "@toll/gateway"

const config = loadConfig("./toll.config.json")
const app = express()

app.use(express.json())
app.use("/mcp", tollMiddleware(config))   // payment enforcement

const mcpServer = createMyMcpServer()
withToll(mcpServer, config)               // fallback handlers for unpaid calls

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
})
```

`toll.config.json`:
```json
{
  "network": "testnet",
  "payTo": "G...",
  "defaultPaymentMode": "x402",
  "tools": {
    "my_free_tool":   { "price": "0",    "currency": "USDC" },
    "my_paid_tool":   { "price": "0.05", "currency": "USDC" },
    "my_mpp_tool":    { "price": "0.10", "currency": "USDC", "paymentMode": "mpp" }
  }
}
```

---

## Tests

```bash
# All packages
pnpm test

# Individual
pnpm --filter @toll/stellar test      # 8 tests
pnpm --filter @toll/gateway test      # 15 tests
pnpm --filter demo-server test        # 10 integration tests
```

---

## Tech Stack

- **Stellar** — USDC payments, Soroban smart contracts
- **x402** — `@x402/core@2.8.0`, `@x402/stellar@2.8.0`
- **MPP** — `@stellar/mpp@0.2.1`, `mppx@0.5.0`
- **MCP SDK** — `@modelcontextprotocol/sdk@1.29.0`
- **Gateway** — Express 4, TypeScript, Zod, SQLite (better-sqlite3)
- **Dashboard** — Next.js 15, Tailwind CSS v4, React 19
- **Monorepo** — pnpm workspaces + Turborepo

---

## License

MIT
