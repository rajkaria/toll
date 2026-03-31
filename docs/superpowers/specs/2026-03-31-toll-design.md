# Toll — Design Spec
**Date:** 2026-03-31
**Project:** Stellar Hacks: Agents hackathon (deadline April 13, 2026)
**Tagline:** The monetization layer for MCP servers

---

## What We're Building

An npm monorepo that wraps any MCP server with x402 and MPP payment gating on Stellar. One config file, one wrapper function — MCP tool calls now earn USDC.

**Two packages + two apps:**
- `@toll/stellar` — payment verification (x402 + MPP)
- `@toll/gateway` — MCP middleware (Express + McpServer wrapping)
- `apps/demo-server` — Watchdog Lite (MCP server wrapped with Toll)
- `apps/dashboard` — Next.js 15 earnings dashboard

---

## Architecture

```
AI Agent (Claude Code, Cursor, etc.)
    │ HTTP POST /mcp  (JSON-RPC: tools/call)
    ▼
Express App (demo-server)
    │
    ├── tollMiddleware() ──── @toll/gateway
    │     ├── Parse JSON-RPC body → extract tool name
    │     ├── Look up price in toll.config.json
    │     ├── No payment header? → return HTTP 402
    │     │   ├── x402 mode: PaymentRequired JSON (PAYMENT-REQUIRED header)
    │     │   └── MPP mode: WWW-Authenticate: Payment header + challenge
    │     ├── Payment header present? → verify via @toll/stellar
    │     │   ├── X402Verifier → @x402/core + @x402/stellar + remote facilitator
    │     │   └── MPPVerifier → @stellar/mpp Charge mode
    │     ├── Verified → EarningsTracker.record(tool, amount, txHash, protocol)
    │     └── Call next() → MCP StreamableHTTP handler
    │
    └── MCP StreamableHTTPServerTransport
          └── McpServer (Watchdog Lite tools)
```

### Monorepo Layout

```
toll/
├── packages/
│   ├── stellar/                    # @toll/stellar
│   │   ├── src/
│   │   │   ├── x402/
│   │   │   │   └── verifier.ts     # X402Verifier: wraps @x402/core + @x402/stellar
│   │   │   ├── mpp/
│   │   │   │   └── verifier.ts     # MPPVerifier: wraps @stellar/mpp + mppx
│   │   │   ├── earnings.ts         # EarningsTracker (SQLite via better-sqlite3)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── gateway/                    # @toll/gateway
│       ├── src/
│       │   ├── middleware.ts        # tollMiddleware() — Express middleware
│       │   ├── withToll.ts          # withToll() — McpServer handler wrapping
│       │   ├── config.ts            # toll.config.json schema + parser (Zod)
│       │   ├── rateLimiter.ts       # In-memory rate limiter (free tier management)
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── demo-server/                # Watchdog Lite
│   │   ├── src/
│   │   │   ├── index.ts            # Express app + MCP transport setup
│   │   │   ├── tools/
│   │   │   │   ├── health.ts       # health_check() — FREE
│   │   │   │   ├── search.ts       # search_competitors() — $0.01 x402
│   │   │   │   ├── sentiment.ts    # analyze_sentiment() — $0.02 x402 (Claude API)
│   │   │   │   └── compare.ts      # compare_products() — $0.05 MPP Charge
│   │   │   └── server.ts           # McpServer instance
│   │   ├── toll.config.json
│   │   └── package.json
│   └── dashboard/                  # Earnings dashboard
│       ├── app/
│       │   ├── page.tsx             # Main dashboard page
│       │   ├── layout.tsx
│       │   └── api/
│       │       └── earnings/
│       │           └── route.ts     # GET /api/earnings → reads SQLite
│       ├── components/
│       │   ├── StatsCards.tsx       # Total earnings, calls, today
│       │   ├── ToolTable.tsx        # Revenue breakdown by tool
│       │   └── TransactionList.tsx  # Recent transactions with tx links
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
└── turbo.json
```

---

## Key Design Decisions

### 1. HTTP Transport Primary, Stdio Secondary

MCP uses JSON-RPC 2.0. **HTTP 402 cannot be returned from inside a tool handler** — the transport always wraps in HTTP 200. Therefore:

- **HTTP (StreamableHTTP)**: Express middleware intercepts the POST before it reaches MCP. Reads the JSON-RPC body, extracts `params.name`, checks pricing. Returns a real HTTP 402 if payment is required. This is the demo-worthy path.
- **Stdio**: `withToll()` wraps each tool's handler via `RegisteredTool.update()`. When payment is needed, returns a tool result with `isError: true` and payment details in the text. Less elegant but functional for stdio-based agents.

### 2. x402 Implementation

Build on `@x402/express` and `@x402/core`. The key classes:

**X402Verifier** (in `@toll/stellar`):
```typescript
// Uses @x402/stellar/exact/server (validates, no settlement) +
//      HTTPFacilitatorClient (calls remote facilitator to settle)
class X402Verifier {
  verify(paymentHeader: string, requirements: PaymentRequirements): Promise<VerifyResult>
  buildRequirements(tool: string, price: string): PaymentRequirements
}
```

The 402 response format (x402 v2):
```json
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "stellar:testnet",
    "asset": "<USDC_SAC_TESTNET>",
    "payTo": "<SERVER_STELLAR_ADDRESS>",
    "amount": "10000",
    "maxTimeoutSeconds": 300,
    "extra": { "areFeesSponsored": true }
  }]
}
```

Client sends signed auth entry in `PAYMENT-SIGNATURE` header (base64-encoded XDR).

### 3. MPP Implementation

Build on `@stellar/mpp` Charge mode + `mppx`. Uses different headers:
- Server: `WWW-Authenticate: Payment` with challenge
- Client: `Authorization: Payment` with signed SAC transfer

**MPPVerifier** (in `@toll/stellar`):
```typescript
class MPPVerifier {
  createMiddleware(tool: string, price: string): RequestHandler  // mppx Charge mode
}
```

MPP is used for `compare_products` (the $0.05 tool) to demonstrate dual-protocol support.

### 4. EarningsTracker

SQLite file at `$TOLL_DATA_DIR/earnings.db` (default: `~/.toll/earnings.db`). Schema:

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  tool TEXT NOT NULL,
  caller TEXT,               -- payer's Stellar address
  amount_usdc REAL NOT NULL,
  protocol TEXT NOT NULL,    -- 'x402' | 'mpp'
  tx_hash TEXT,
  created_at INTEGER NOT NULL  -- unix timestamp
);

CREATE TABLE rate_limit_usage (
  caller_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  call_count INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  PRIMARY KEY (caller_id, tool)
);
```

Dashboard reads from same file. In demo-server and dashboard deployed separately, they share the DB file path via environment variable.

### 5. toll.config.json Schema

```typescript
interface TollConfig {
  network: "testnet" | "mainnet"
  payTo: string                    // Stellar G... address
  facilitatorUrl: string           // x402 facilitator endpoint
  defaultPaymentMode: "x402" | "mpp"
  tools: Record<string, ToolConfig>
  mpp?: {
    enabled: boolean
    recipientAddress: string       // may differ from payTo
  }
}

interface ToolConfig {
  price: string                    // "0.01" USDC, "0" for free
  currency: "USDC"
  description?: string
  paymentMode?: "x402" | "mpp"     // overrides defaultPaymentMode
  rateLimit?: {
    free: number                   // free calls per window
    perHour: boolean
    paidPrice: string              // price after free tier exhausted
  }
}
```

### 6. tollMiddleware() Flow

```typescript
export function tollMiddleware(config: TollConfig): RequestHandler {
  const x402 = new X402Verifier(config)
  const mpp = new MPPVerifier(config)
  const earnings = new EarningsTracker(config)
  const rateLimiter = new RateLimiter(config)

  return async (req, res, next) => {
    // Only intercept tool calls
    if (!isMcpToolCall(req.body)) return next()

    const toolName = req.body.params?.name
    const toolConfig = config.tools[toolName]

    // Free tools or rate-limited within free tier
    if (!toolConfig || isWithinFreeTier(req, toolConfig, rateLimiter)) {
      rateLimiter.increment(getCallerId(req), toolName)
      return next()
    }

    const protocol = toolConfig.paymentMode ?? config.defaultPaymentMode

    if (protocol === "x402") {
      const paymentHeader = req.headers["payment-signature"] as string
      if (!paymentHeader) {
        return send402X402(res, x402.buildRequirements(toolName, toolConfig.price))
      }
      const result = await x402.verify(paymentHeader, x402.buildRequirements(toolName, toolConfig.price))
      if (!result.valid) return res.status(402).json({ error: result.error })
      earnings.record({ tool: toolName, protocol: "x402", ...result })
      return next()
    }

    if (protocol === "mpp") {
      // Delegate to mppx middleware which handles WWW-Authenticate/Authorization headers
      return mpp.createMiddleware(toolName, toolConfig.price)(req, res, next)
    }
  }
}
```

### 7. Demo Server (Watchdog Lite) Tools

| Tool | Price | Protocol | Implementation |
|------|-------|----------|----------------|
| `health_check()` | FREE | — | Returns server status, Toll version, uptime |
| `search_competitors(query)` | $0.01 USDC | x402 | Mock data: 3 hardcoded competitor profiles per query keyword |
| `analyze_sentiment(url)` | $0.02 USDC | x402 | **Real Claude API** (`claude-haiku-4-5`) — fetches URL text, analyzes sentiment |
| `compare_products(a, b)` | $0.05 USDC | MPP | Mock structured comparison (pros/cons/verdict) |

### 8. Dashboard

Next.js 15 App Router + Tailwind + shadcn/ui. Route: `/api/earnings` reads SQLite and returns:
```json
{
  "totalEarnings": 4.23,
  "totalCalls": 287,
  "todayEarnings": 0.89,
  "todayCalls": 63,
  "byTool": [
    { "tool": "search_competitors", "calls": 142, "revenue": 1.42, "avgPrice": 0.01 }
  ],
  "recentTransactions": [
    { "tool": "search_competitors", "amount": 0.01, "protocol": "x402", "txHash": "...", "at": "12:03" }
  ],
  "protocolSplit": { "x402": 78, "mpp": 22 }
}
```

Dashboard auto-refreshes every 10 seconds. Links to Stellar testnet explorer for each tx hash.

---

## External Dependencies

| Package | Purpose | Source |
|---------|---------|--------|
| `@x402/core` | x402 server-side verification | npm v2.8.0 |
| `@x402/stellar` | Stellar-specific x402 scheme | npm v2.8.0 |
| `@x402/express` | Express paymentMiddleware reference | npm v2.8.0 |
| `@stellar/mpp` | MPP Charge mode | npm (stellar-experimental) |
| `mppx` | MPP HTTP 402 protocol middleware | npm |
| `@stellar/stellar-sdk` | Stellar SDK | npm |
| `@modelcontextprotocol/sdk` | MCP server | npm v1.29.0 |
| `better-sqlite3` | SQLite for EarningsTracker | npm |
| `zod` | Config validation | npm |
| `express` | HTTP server | npm |
| `@anthropic-ai/sdk` | Claude API (analyze_sentiment) | npm |

---

## Build Sequence (13 days to April 13)

### Week 1 (Days 1–6): Core + Demo Server
1. **Day 1**: Repo scaffold, pnpm workspace, tsconfig, turbo. Set up Stellar testnet wallets.
2. **Day 2**: `@toll/stellar` — X402Verifier using `@x402/core` + `@x402/stellar` + remote facilitator
3. **Day 3**: `@toll/stellar` — MPPVerifier using `@stellar/mpp` Charge mode + `mppx`
4. **Day 4**: `@toll/gateway` — `tollMiddleware()`, config parser, EarningsTracker
5. **Day 5**: `apps/demo-server` — All 4 tools, Express + StreamableHTTP transport, toll.config.json
6. **Day 6**: End-to-end test: agent calls tool → 402 → pays → gets result. Debug/fix.

### Week 2 (Days 7–10): Dashboard + Polish
7. **Day 7**: `apps/dashboard` — Next.js scaffold, API route, StatsCards
8. **Day 8**: Dashboard — ToolTable, TransactionList, auto-refresh, Stellar explorer links
9. **Day 9**: `withToll()` for stdio transport. README. gstack QA screenshots.
10. **Day 10–13**: Demo video recording, final polish, hackathon submission.

---

## Testnet Wallet Setup

Two wallets needed:
- **Server wallet** (`TOLL_SERVER_KEY`): receives payments. Funded with testnet XLM.
- **Test agent wallet** (`TOLL_AGENT_KEY`): sends payments. Funded with testnet XLM + USDC.

Both created via Stellar Lab (https://laboratory.stellar.org/). Testnet USDC from Stellar Lab's USDC faucet (USDC issuer on testnet: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`).

Facilitator: Use the hosted testnet facilitator from the x402-stellar repo or `https://x402-facilitator.stellar.org` if available.

---

## gstack QA Plan

- Screenshot dashboard before/after each payment type (x402, MPP)
- Verify 402 response body is correct JSON in network tab
- Test dashboard responsiveness on mobile viewport
- Capture before/after screenshots for README and hackathon submission

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| MPP `@stellar/mpp` is experimental, may have bugs | Start with Charge mode only (simplest path). Channel mode is bonus. |
| Facilitator service unavailable on testnet | Run local facilitator from x402-stellar repo as fallback |
| x402 Soroban auth entry format changes (v2 vs older) | Pin to `@x402/stellar@2.8.0`, test early |
| MCP JSON-RPC body parsing — body might be streamed | Use `express.json()` middleware before tollMiddleware; test with real MCP client |
| USDC testnet balance issues | Fund agent wallet with 100+ USDC upfront; script to refund for demo |
