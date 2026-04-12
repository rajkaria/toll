# Toll

> **The Stripe for MCP Servers -- monetize any AI tool with one line of code, settled in USDC on Stellar.**

[tollpay.xyz](https://tollpay.xyz) | [Live Demo](https://api.tollpay.xyz/mcp) | [Dashboard](https://tollpay.xyz/dashboard) | [Vision](./VISION.md)

---

## The Problem

There are 10,000+ MCP servers powering AI agents today. Not a single one has a way to get paid.

Developers build powerful tools -- search, analysis, data extraction -- and give them away for free. There's no Stripe for MCP. No payment infrastructure designed for how AI agents consume services: per-call, sub-second, programmatic.

## The Solution

Toll is a drop-in middleware that turns any MCP server into a paid API. Add 3 lines of config. Every tool call earns USDC on Stellar.

```typescript
import { tollMiddleware } from "@rajkaria123/toll-gateway"

app.use("/mcp", tollMiddleware({
  payTo: "G...YOUR_STELLAR_ADDRESS",
  tools: {
    search:    { price: "0.01" },
    analyze:   { price: "0.02" },
    compare:   { price: "0.05" },
  }
}))
```

That's it. No wallet setup. No blockchain code. No payment infrastructure.

## How It Works

```
1. Agent calls your MCP tool          POST /mcp { tool: "search" }
2. Toll intercepts, returns the price  <-- HTTP 402 { price: $0.01 USDC }
3. Agent signs payment on Stellar      --> USDC tx on Stellar mainnet
4. Toll verifies + settles on-chain    <-- Self-hosted Soroban settlement
5. Tool executes, you earn money       --> Result + earnings tracked
```

### Architecture

```
+--------------------------------------------------------------+
|  AI AGENT (Claude, Cursor, any MCP client)                   |
|                                                              |
|  Calls tool -> gets 402 -> pays USDC on Stellar -> gets result|
+----------------------+---------------------------------------+
                       |  MCP Protocol (HTTP)
                       v
+--------------------------------------------------------------+
|  TOLL GATEWAY (npm middleware)                               |
|                                                              |
|  +----------+  +----------+  +--------------+               |
|  | x402     |  | MPP      |  | Free/Metered |               |
|  | per-call |  | session  |  | rate-limited |               |
|  +----+-----+  +----+-----+  +------+-------+               |
|       +------------- +---------------+                       |
|  +---------------------------------------------------+      |
|  |  Self-Hosted Settlement (Soroban)                  |      |
|  |  Replay Protection . Spending Policies . Earnings  |      |
|  +---------------------------------------------------+      |
+----------------------+---------------------------------------+
                       |
                       v
+--------------------------------------------------------------+
|  YOUR MCP SERVER (unchanged -- Toll wraps it)                |
|  search_competitors . analyze_sentiment . compare_products   |
+--------------------------------------------------------------+
                       |
                       v
+--------------------------------------------------------------+
|  STELLAR MAINNET                                             |
|  USDC settlement . Sub-second finality . Near-zero fees      |
+--------------------------------------------------------------+
```

## Why Stellar

| Requirement | Why It Matters | Stellar |
|---|---|---|
| **Sub-second finality** | Agents can't wait 12s for Ethereum blocks | 3-5 second settlement |
| **Near-zero fees** | A $0.001 tool call must be profitable | ~$0.00001 per tx |
| **Native USDC** | No bridge risk, no wrapped tokens | First-class Stellar asset |
| **Programmable payments** | x402 + MPP protocol support | Both protocols live |

## Live on Mainnet

Toll is deployed and processing real USDC payments on Stellar mainnet.

- **Demo server:** [api.tollpay.xyz](https://api.tollpay.xyz/mcp)
- **Dashboard:** [tollpay.xyz](https://tollpay.xyz)
- **On-chain transactions:** See [TRANSACTIONS.md](./TRANSACTIONS.md) for verified mainnet proof

### Try the live demo

Connect to our demo MCP server in Claude Desktop, Cursor, or any MCP client:

```json
{
  "mcpServers": {
    "watchdog": {
      "url": "https://api.tollpay.xyz/mcp",
      "transport": "streamable-http"
    }
  }
}
```

| Tool | Price | Protocol |
|------|-------|----------|
| `health_check` | FREE | -- |
| `search_competitors` | $0.01 USDC | x402 |
| `analyze_sentiment` | $0.02 USDC | x402 |
| `compare_products` | $0.05 USDC | x402 |

### Test the 402 flow

```bash
# Free tool -- works immediately
curl -X POST https://api.tollpay.xyz/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"health_check","arguments":{}}}'

# Paid tool -- returns HTTP 402 with Stellar payment requirements
curl -X POST https://api.tollpay.xyz/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_competitors","arguments":{"query":"CRM"}}}'
```

## Agent SDK

For AI agents that need to discover and pay for tools automatically:

```typescript
import { TollClient } from "@rajkaria123/toll-sdk"

const toll = new TollClient({
  serverUrl: "https://api.tollpay.xyz",
  secretKey: "S...",  // Stellar Ed25519 secret key
  budget: { maxPerCall: "0.10", maxDaily: "5.00" },
})

// Free tool -- no payment needed
const health = await toll.callTool("health_check")

// Paid tool -- 402 -> auto-sign -> auto-retry -> result
const result = await toll.callTool("search_competitors", { query: "CRM" })
// { success: true, data: {...}, paid: true, amount: "0.01", protocol: "x402" }
```

## Quick Start (5 minutes)

### 1. Install

```bash
npm install @rajkaria123/toll-gateway @rajkaria123/toll-stellar
```

### 2. Create `toll.config.json`

```json
{
  "network": "mainnet",
  "payTo": "G...YOUR_STELLAR_ADDRESS",
  "tools": {
    "my_free_tool":  { "price": "0",    "currency": "USDC" },
    "my_paid_tool":  { "price": "0.05", "currency": "USDC" }
  },
  "spendingPolicy": {
    "maxPerCall": "0.10",
    "maxDailyPerCaller": "1.00",
    "maxDailyGlobal": "10.00"
  }
}
```

### 3. Wrap your MCP server

```typescript
import express from "express"
import { tollMiddleware, loadConfig } from "@rajkaria123/toll-gateway"
import { X402Verifier, EarningsTracker } from "@rajkaria123/toll-stellar"

const config = loadConfig("./toll.config.json")
const x402 = new X402Verifier(config)
const earnings = new EarningsTracker()

const app = express()
app.use("/mcp", tollMiddleware({ config, x402, earnings }))
```

### 4. Deploy and earn

Your MCP server now charges USDC for every paid tool call. Visit [tollpay.xyz/dashboard](https://tollpay.xyz/dashboard) to see revenue in real time.

## Packages

| Package | What It Does |
|---------|-------------|
| [`@rajkaria123/toll-gateway`](https://www.npmjs.com/package/@rajkaria123/toll-gateway) | Express middleware -- intercepts MCP calls, returns 402, verifies payment, tracks earnings |
| [`@rajkaria123/toll-stellar`](https://www.npmjs.com/package/@rajkaria123/toll-stellar) | Stellar integration -- x402 verifier, self-hosted Soroban settlement, earnings tracker |
| [`@rajkaria123/toll-sdk`](https://www.npmjs.com/package/@rajkaria123/toll-sdk) | Agent SDK -- auto-handles 402, signs payments, budget tracking |
| [`@rajkaria123/toll-cli`](https://www.npmjs.com/package/@rajkaria123/toll-cli) | Developer CLI -- `toll init`, `toll status`, `toll register` |
| `@rajkaria123/toll-proxy` | MCP proxy -- auto-pays for tool calls, budget controls |

All packages published on npm as v0.1.0.

## Security

- **Replay protection** -- Payment signatures cached and rejected on reuse (5-minute TTL)
- **Spending policies** -- Per-call limits, daily per-caller budgets, global daily caps
- **Input validation** -- Zod-based validation on all MCP requests
- **Self-hosted settlement** -- Server submits Soroban transactions directly, no external facilitator dependency
- **No key exposure** -- Server never touches agent private keys

## Built With

- **[Stellar](https://stellar.org)** -- USDC settlement on mainnet (sub-second, near-zero fees)
- **[x402](https://x402.org)** -- HTTP 402 payment protocol (per-call micropayments)
- **[MCP](https://modelcontextprotocol.io)** -- Model Context Protocol (Anthropic)
- **TypeScript** -- Monorepo with 5 packages, full type safety
- **Next.js 15** -- Dashboard and landing page
- **Express** -- MCP server runtime

## License

MIT

---

**Built for the [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) hackathon.**

*Toll is live at [tollpay.xyz](https://tollpay.xyz). Payments are real. The future of AI monetization runs on Stellar.*
