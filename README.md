# Toll — The Stripe for MCP Servers

**You built an MCP server. Here's how to get paid.**

[tollpay.xyz](https://tollpay.xyz) · [Live Demo](https://api.tollpay.xyz/mcp) · [Docs](https://tollpay.xyz/docs)

---

## Install

```bash
npm install @rajkaria123/toll-gateway
```

## Add a paywall in 3 lines

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

That's it. When an AI agent calls your tool, Toll returns HTTP 402 with the price. The agent pays USDC on Stellar, the tool executes, and you earn money.

## See it work

Here's Watchdog — a real MCP server. Here's Watchdog with Toll. Here's Watchdog earning money.

```
Agent calls search_competitors → Toll returns 402 ($0.01 USDC)
Agent signs payment on Stellar → Toll verifies on-chain → Tool executes
Dashboard: $0.01 earned | tx verified on Stellar mainnet
```

### Connect to the live demo

Paste this into Claude Desktop, Cursor, or any MCP client:

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

The `health_check` tool is free. Paid tools require a funded Stellar wallet with USDC.

## Dashboard

Visit [tollpay.xyz/dashboard](https://tollpay.xyz/dashboard) to see real-time earnings, per-tool revenue, and every transaction linked to its Stellar mainnet explorer page.

## How it works

```
AI Agent → POST /mcp → Toll Paywall → 402 Payment Required
                                    ← USDC payment on Stellar
                                    → Tool executes → Response
```

1. Agent calls your MCP tool via HTTP
2. Toll intercepts and returns 402 with the price
3. Agent's wallet signs a USDC payment on Stellar
4. Toll verifies the on-chain payment and lets the call through
5. Earnings tracked in real-time on your dashboard

## Configuration

```json
{
  "network": "mainnet",
  "payTo": "G...YOUR_STELLAR_ADDRESS",
  "facilitatorUrl": "https://channels.openzeppelin.com/x402",
  "tools": {
    "free_tool":  { "price": "0",    "currency": "USDC" },
    "paid_tool":  { "price": "0.05", "currency": "USDC" }
  },
  "spendingPolicy": {
    "maxPerCall": "0.10",
    "maxDailyPerCaller": "1.00"
  }
}
```

## Agent SDK

For agents that need to pay for tools automatically:

```typescript
import { TollClient } from "@rajkaria123/toll-sdk"

const toll = new TollClient({
  serverUrl: "https://api.tollpay.xyz",
  secretKey: "S...",
  budget: { maxPerCall: "0.10", maxDaily: "5.00" },
})

const result = await toll.callTool("search_competitors", { query: "CRM" })
```

## Packages

| Package | Purpose |
|---------|---------|
| `@rajkaria123/toll-gateway` | Express paywall — intercepts MCP calls, handles 402/payment/verification |
| `@rajkaria123/toll-stellar` | Stellar verifiers (x402 + MPP), earnings tracking, audit log |
| `@rajkaria123/toll-sdk` | Agent-side client — auto-handles 402, signs payments, tracks budget |
| `@rajkaria123/toll-cli` | Developer CLI — `toll init`, `toll status` |

## Tech Stack

- **Stellar** — USDC settlement on mainnet
- **x402** — HTTP 402 payment protocol with facilitator settlement
- **MCP** — Model Context Protocol (Anthropic)
- **TypeScript** — Monorepo with 5 packages
- **Next.js 15** — Dashboard and landing page
- **Express** — MCP server runtime


## License

MIT
