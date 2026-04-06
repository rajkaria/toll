# Toll — The Agent Revenue Protocol for Stellar

> Toll is a payment gateway that lets MCP (Model Context Protocol) servers charge AI agents for tool usage using **x402** and **MPP** on **Stellar** — with spending policies, session tokens, dynamic pricing, and real-time analytics.

Built for the [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp) hackathon.

**Live:** [tollpay.xyz](https://tollpay.xyz) · **Standard:** [SAPS Specification](specs/SAPS.md)

---

## Architecture

```
AI Agent  →  POST /mcp  →  Toll Gateway  →  MCP Server
                │                │
                │   [SpendingPolicy check]
                │   [402 + PaymentRequired]
                │◄───────────────┘
                │
                │   [payment-signature / Authorization: Payment]
                ↓
              Stellar Testnet (USDC / XLM)
```

**Five composable primitives:**

| Primitive | Purpose |
|-----------|---------|
| **PaymentGate** | Express middleware — x402 + MPP dual-protocol gating |
| **SpendingPolicy** | Budget caps, daily limits, caller allowlists |
| **EarningsLedger** | SQLite tracking with tamper-evident audit log |
| **ProtocolBridge** | x402 per-call + MPP session-based settlement |
| **ConfigDSL** | Declarative JSON for tools, prices, tiers, sessions |

---

## Packages

```
toll/
├── packages/
│   ├── stellar/        @toll/stellar   — Verifiers, earnings, auth, audit, analytics, assets
│   ├── gateway/        @toll/gateway   — Middleware, pricing, sessions, health, metrics, webhooks
│   ├── sdk/            @toll/sdk       — Agent-side client (TollClient, TollAggregator)
│   ├── cli/            @toll/cli       — Developer CLI (toll init, toll status)
│   └── contracts/      @toll/contracts — Soroban contract interfaces (escrow, revenue share)
├── apps/
│   ├── demo-server/    Watchdog Lite — 4 monetized MCP tools
│   └── dashboard/      Next.js 15 earnings dashboard at tollpay.xyz
├── scripts/            Demo agent + wallet setup
├── specs/              SAPS specification
├── helm/               Kubernetes Helm chart
├── Dockerfile          Container build
└── docker-compose.yml  Full stack with Redis
```

---

## Quick Start

```bash
# 1. Install
pnpm install

# 2. Set up testnet wallets
pnpm --filter toll-scripts exec tsx setup-wallet.ts

# 3. Configure (or use CLI)
npx @toll/cli init

# 4. Start the demo server
pnpm --filter demo-server dev

# 5. Start the dashboard
pnpm --filter dashboard dev

# 6. Run the demo agent
AGENT_SECRET_KEY=S... pnpm --filter toll-scripts exec tsx demo-agent.ts
```

---

## Features (30 total)

### Payment & Security
- **x402 + MPP** dual-protocol settlement on Stellar
- **Replay protection** — signature deduplication with TTL
- **Payment validation** — amount/slippage checking on settle
- **402 rate limiting** — anti-enumeration with exponential backoff
- **Input sanitization** — size limits, HTML strip, prototype pollution prevention
- **Tamper-evident audit log** — SHA-256 hash chain in SQLite
- **Stellar keypair authentication** — challenge-response, not just IP/API key

### Pricing & Business
- **Dynamic pricing** — time-of-day, demand-based, custom rules
- **Tiered pricing** — volume discounts (first 10 free, then $0.005, etc.)
- **A/B price testing** — deterministic variant assignment per caller
- **Bundle pricing** — multi-tool packs (pay once for N calls)
- **Pre-funded sessions** — pay upfront, draw down per call
- **Auto-negotiation** — agents propose price, server counters
- **Invoices & receipts** — with Stellar Expert links

### Infrastructure
- **Structured logging** — JSON with correlation IDs
- **Prometheus metrics** — `/metrics` endpoint
- **Health endpoints** — `/health`, `/health/ready`, `/health/tools`
- **Cost estimation** — `POST /cost` before committing
- **Pluggable state store** — memory (default) or Redis
- **Secrets rotation** — dual-key grace period
- **Webhooks** — payment.received, payment.failed, etc.
- **Docker + Helm** — production deployment stack

### SDK & Ecosystem
- **@toll/sdk** — TollClient for agents (auto-pay, budget tracking)
- **Multi-server aggregation** — TollAggregator routes across servers
- **CLI scaffolding** — `toll init`, `toll status`
- **Multi-asset support** — USDC, XLM, EURC, custom assets
- **Marketplace manifest** — `/registry/manifest` for tool discovery
- **Soroban contracts** — escrow, revenue share (interface + mock)
- **SAPS specification** — Stellar Agent Payment Standard

---

## Demo Server Tools

| Tool | Price | Protocol | Description |
|------|-------|----------|-------------|
| `health_check` | FREE | — | Server status and version |
| `search_competitors` | $0.01 USDC | x402 | Competitor intelligence |
| `analyze_sentiment` | $0.02 USDC | x402 | AI sentiment via Claude |
| `compare_products` | $0.05 USDC | MPP | Product comparison |

---

## Agent SDK Usage

```typescript
import { TollClient } from "@toll/sdk"

const toll = new TollClient({
  serverUrl: "http://localhost:3002",
  secretKey: "S...",
  budget: { maxPerCall: "0.10", maxDaily: "5.00" },
})

// Auto-handles 402 → pay → retry
const result = await toll.callTool("search_competitors", { query: "CRM tools" })
console.log(result.data) // tool output
console.log(toll.getSpending()) // { totalSpent: 0.01, callCount: 1, ... }
```

---

## Configuration

```json
{
  "network": "testnet",
  "payTo": "G...",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": {
    "my_free_tool": { "price": "0", "currency": "USDC" },
    "my_paid_tool": { "price": "0.05", "currency": "USDC" }
  },
  "spendingPolicy": {
    "maxPerCall": "0.10",
    "maxDailyPerCaller": "1.00",
    "maxDailyGlobal": "10.00"
  }
}
```

See [docs](https://tollpay.xyz/docs) for full configuration reference with all 30+ optional fields.

---

## Tests

```bash
pnpm -r test           # 38 tests across 4 packages
```

| Package | Tests |
|---------|-------|
| @toll/stellar | 9 |
| @toll/gateway | 16 |
| @toll/sdk | 3 |
| demo-server | 10 |

---

## Deployment

### Docker

```bash
docker-compose up -d
```

### Helm

```bash
helm install toll helm/toll --set env.TOLL_SERVER_SECRET=S...
```

### Vercel (Dashboard)

```bash
cd apps/dashboard && npx vercel --prod
```

---

## Tech Stack

- **Stellar** — USDC/XLM settlement, Soroban smart contracts
- **x402** — `@x402/core@2.8.0`, `@x402/stellar@2.8.0`
- **MPP** — `@stellar/mpp@0.2.1`, `mppx@0.5.0`
- **MCP SDK** — `@modelcontextprotocol/sdk@1.29.0`
- **Server** — Express 4, TypeScript strict, Zod, SQLite
- **Dashboard** — Next.js 15, React 19, Tailwind CSS 4
- **Monorepo** — pnpm workspaces + Turborepo

---

## Standard

Toll implements the [SAPS (Stellar Agent Payment Standard)](specs/SAPS.md) — a proposed protocol for how AI agents discover, negotiate, and pay for MCP tools on Stellar.

## License

MIT
