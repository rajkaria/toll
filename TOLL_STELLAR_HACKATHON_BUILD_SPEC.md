# Toll — x402 MCP Monetization Gateway for Stellar

## Build Spec for "Agents on Stellar" Hackathon

**Hackathon:** Stellar Hacks: Agents (DoraHacks)
**Prize Pool:** $10,000 in XLM (1st: $5K, 2nd: $2K, 3rd: $1.25K, 4th: $1K, 5th: $750)
**Deadline:** April 13, 2026
**Submission:** https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp
**Support:** Stellar Hacks Telegram + Stellar Dev Discord

---

## STRATEGIC ANALYSIS

### What Won Previous x402 Hackathons (Cronos x402, 191 teams)

| Place | Project | Category | Why It Won |
|-------|---------|----------|------------|
| 1st ($24K) | AgentFabric | Infrastructure | "Connective tissue" — programmable permissions for agents to move capital. Meta-layer enabling other apps. |
| 2nd ($5K) | Cronos Shield | Security | Automated risk management engine for agent transactions |
| 3rd ($2K) | CroIgnite | Dev Tooling | Streamlined onboarding for new x402 projects |
| Finance ($5K) | SoulForge Market | Agentic Finance | AI agent interacting with financial markets autonomously |
| Ecosystem ($3K) | Faktory | Treasury | AI-native treasury system with invoice management |
| Tooling ($3K) | x402 Intent Firewall | Security | Safety middleware / sanity checks for programmatic payments |

**Pattern: Infrastructure and tooling layers win. Single-use apps lose.**

### What 80% of Competitors Will Build (Claude/GPT-Obvious Ideas)

These are listed in the hackathon's "Ideas & Inspiration" tab. Every AI-assisted builder will gravitate here:
- Pay-per-query search API (literally the example in the brief)
- Agent wallet wrapper
- Simple x402 paywall on an API
- Pay-per-token AI inference service
- Agent marketplace / service discovery
- DeFi integration with agent payments

### The Gap Nobody Is Filling

The hackathon resources include an x402 MCP server (jamesbachini/x402-mcp-stellar) that lets agents **PAY** for x402 services. But nobody has built the reverse:

**A tool that lets any MCP server developer EARN money via x402/MPP on Stellar.**

There are thousands of MCP servers. Zero have a monetization layer. This is the gap.

---

## PRODUCT: TOLL

### Vision (< 256 chars)
Toll — the monetization layer for MCP servers. Wrap any MCP server with x402 and MPP payment gating on Stellar. Every tool call earns USDC. Turn your AI tools into a business.

### One-liner
**An npm middleware that lets any MCP server developer monetize their tools with per-call micropayments on Stellar, supporting both x402 (Coinbase) and MPP (Stripe) payment protocols.**

### Why This Wins

1. **Infrastructure play** — exactly the pattern that won Cronos (AgentFabric). Toll enables an entire ecosystem of paid MCP tools, not just one use case.

2. **Nobody has built this.** The existing x402 MCP server is a CLIENT (agent pays for services). Toll is a SERVER-SIDE SDK (developer earns from services). Opposite direction.

3. **MCP is the hottest standard in AI** — Claude Code, Cursor, Windsurf, Cline, VS Code Copilot all support MCP. Thousands of MCP servers exist. Zero monetization layer.

4. **Perfect protocol alignment** — MCP tool calls are HTTP/stdio requests. x402 is per-HTTP-request payment. MPP supports session-based bulk payments. The mapping is 1:1.

5. **Dual protocol support** — x402 (Coinbase, per-request) AND MPP (Stripe, session-based). Nobody else will do both. The hackathon explicitly calls out both protocols.

6. **Raj's exact domain** — you build MCP servers (Watchdog, AGNT). You understand MCP infrastructure deeply. Nobody else in this hackathon has that edge.

7. **"Feels obvious in hindsight"** — the hackathon brief literally says they want products like this. Of course MCP servers should be monetizable. Of course the payment layer should be Stellar.

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENT (Claude Code, Cursor, etc.)       │
│                                                               │
│  Agent calls MCP tool → gets 402 → pays via Stellar → result │
└──────────────────────────┬────────────────────────────────────┘
                           │ MCP Protocol (stdio / SSE / HTTP)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     TOLL GATEWAY (npm package)                │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  x402 Mode  │  │  MPP Mode    │  │  Free/Metered Mode  │ │
│  │  (per-call)  │  │  (session)   │  │  (rate-limited)     │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │             │
│  ┌──────▼────────────────▼──────────────────────▼──────────┐ │
│  │              Payment Verification Layer                  │ │
│  │  - Verify Stellar tx (x402 facilitator)                  │ │
│  │  - Verify MPP session credential                         │ │
│  │  - Rate limiting / free tier management                  │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              Earnings Tracker                            │ │
│  │  - Per-tool revenue tracking                             │ │
│  │  - Per-caller analytics                                  │ │
│  │  - Balance dashboard                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ Proxies authenticated calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              YOUR MCP SERVER (any existing server)            │
│              (unchanged — Toll wraps it transparently)        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    STELLAR NETWORK                            │
│  Testnet / Mainnet — USDC (SAC) payments                     │
│  x402 facilitator for verification                           │
│  MPP Stripe sessions for bulk payments                       │
│  Sub-second settlement, ~$0.00001 fees                       │
└─────────────────────────────────────────────────────────────┘
```

### Payment Flow: x402 Mode (Per-Call)

```
1. Agent calls MCP tool (e.g., "search_competitors")
2. Toll intercepts → checks if tool requires payment
3. Returns HTTP 402 with payment details:
   {
     "x402Version": 1,
     "accepts": [{
       "scheme": "exact",
       "network": "stellar",
       "maxAmountRequired": "10000",     // 0.001 USDC (7 decimals)
       "resource": "tool://search_competitors",
       "payTo": "GSERVER_STELLAR_ADDRESS...",
       "asset": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
     }]
   }
4. Agent's x402 client signs Soroban SAC transfer auth entry
5. Agent retries request with X-PAYMENT header containing signed auth
6. Toll verifies payment via Stellar facilitator
7. If valid → proxies tool call to underlying MCP server → returns result
8. Logs revenue: tool, caller, amount, timestamp, tx hash
```

### Payment Flow: MPP Mode (Session-Based)

```
1. Agent opens MPP session with Toll-wrapped server
2. Toll creates Stripe MPP session → returns session credential
3. For each tool call during session:
   a. Agent includes MPP credential in request
   b. Toll verifies credential validity + remaining balance
   c. Deducts per-call amount from session
   d. Proxies tool call → returns result
4. Session settles on Stellar when closed or expired
5. Server owner receives USDC on Stellar
```

### Payment Flow: Metered/Free Mode

```
1. Some tools can be free (discovery, health checks)
2. Some tools can have rate limits (5 free calls/hour, then paid)
3. Configured per-tool in toll.config.json
```

---

## TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Core Package | TypeScript npm package | Universal — works with any Node.js MCP server |
| x402 Integration | `@x402/stellar` npm package | Official Stellar x402 SDK from the hackathon resources |
| MPP Integration | `stellar-mpp-sdk` | Experimental Stellar MPP SDK — shows dual-protocol support |
| Stellar SDK | `@stellar/stellar-sdk` | Core Stellar interactions |
| MCP Protocol | `@modelcontextprotocol/sdk` | Standard MCP server SDK |
| Demo Server | TypeScript + Express | Example MCP server wrapped with Toll |
| Dashboard | Next.js 15 + Tailwind | Earnings dashboard for server operators |
| Network | Stellar Testnet | Required by hackathon. Testnet USDC via Stellar Lab. |

---

## PACKAGE DESIGN

### Installation (Developer Experience)

```bash
npm install @toll/gateway @toll/stellar
```

### Configuration: `toll.config.json`

```json
{
  "network": "testnet",
  "payTo": "GXXXX...YOUR_STELLAR_ADDRESS",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": {
    "search_competitors": {
      "price": "0.01",
      "currency": "USDC",
      "description": "Search competitor data"
    },
    "analyze_market": {
      "price": "0.05",
      "currency": "USDC",
      "description": "Deep market analysis"
    },
    "health_check": {
      "price": "0",
      "description": "Free health check endpoint"
    },
    "basic_lookup": {
      "price": "0",
      "rateLimit": {
        "free": 10,
        "perHour": true,
        "paidPrice": "0.001"
      },
      "description": "Free for 10 calls/hour, then paid"
    }
  },
  "mpp": {
    "enabled": true,
    "sessionPrice": "1.00",
    "sessionDuration": 3600,
    "callsIncluded": 100
  }
}
```

### Usage: Wrapping an Existing MCP Server

```typescript
// Before: Regular MCP server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-cool-server", version: "1.0.0" });

server.tool("search_competitors", { query: z.string() }, async ({ query }) => {
  // your existing tool logic
  return { content: [{ type: "text", text: results }] };
});

// After: Same server, now monetized with Toll
import { withToll } from "@toll/gateway";
import tollConfig from "./toll.config.json";

const monetizedServer = withToll(server, tollConfig);
// That's it. Every tool call now requires payment.
```

### Alternative: Express Middleware for HTTP-based MCP

```typescript
import express from "express";
import { tollMiddleware } from "@toll/gateway";
import tollConfig from "./toll.config.json";

const app = express();

// Add Toll payment gate to all /mcp/* routes
app.use("/mcp", tollMiddleware(tollConfig));

// Your existing MCP HTTP transport routes
app.post("/mcp/tools/:toolName", async (req, res) => {
  // Toll already verified payment before this runs
  const result = await executeToolCall(req.params.toolName, req.body);
  res.json(result);
});
```

---

## DELIVERABLES (What We Ship)

### 1. `@toll/gateway` — Core npm Package

The middleware that wraps any MCP server with payment gating.

**Key modules:**
- `withToll(server, config)` — wraps an MCP Server instance
- `tollMiddleware(config)` — Express middleware for HTTP transport
- `PaymentVerifier` — verifies x402 and MPP payments on Stellar
- `EarningsTracker` — tracks revenue per tool, per caller
- `RateLimiter` — manages free tier + metered pricing

### 2. `@toll/stellar` — Stellar Payment Layer

Handles all Stellar-specific payment verification.

**Key modules:**
- `X402Verifier` — verifies x402 Soroban auth entries via facilitator
- `MPPVerifier` — verifies MPP session credentials on Stellar
- `StellarWallet` — manages server's receiving wallet
- `TransactionLogger` — logs all payments with tx hashes

### 3. Demo MCP Server: "Watchdog Lite"

A real, useful MCP server wrapped with Toll — a simplified version of your Watchdog competitor intelligence tool.

**Tools (all x402-gated):**
- `search_competitors(query)` — $0.01/call — searches for competitor info
- `analyze_sentiment(url)` — $0.02/call — analyzes sentiment of a webpage
- `compare_products(product_a, product_b)` — $0.05/call — side-by-side comparison
- `health_check()` — FREE — returns server status

**Why a real server matters:** Judges need to see Toll working end-to-end, not just as a library. The demo server IS the demo.

### 4. Earnings Dashboard (Next.js)

A web dashboard where MCP server operators view their earnings.

```
┌─────────────────────────────────────────────────────┐
│  Toll Dashboard — Watchdog Lite                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  💰 Total Earnings: 4.23 USDC                        │
│  📊 Total Calls: 287                                 │
│  📈 Today: 0.89 USDC (63 calls)                     │
│                                                      │
│  Revenue by Tool:                                    │
│  ┌──────────────────────┬────────┬────────┬────────┐│
│  │ Tool                 │ Calls  │ Revenue│ Avg    ││
│  │ search_competitors   │ 142    │ $1.42  │ $0.01  ││
│  │ analyze_sentiment    │ 89     │ $1.78  │ $0.02  ││
│  │ compare_products     │ 41     │ $2.05  │ $0.05  ││
│  │ health_check         │ 15     │ FREE   │ $0.00  ││
│  └──────────────────────┴────────┴────────┴────────┘│
│                                                      │
│  Recent Transactions:                                │
│  12:03 — search_competitors — 0.01 USDC — tx: abc.. │
│  12:01 — analyze_sentiment — 0.02 USDC — tx: def..  │
│  11:58 — compare_products — 0.05 USDC — tx: ghi..   │
│                                                      │
│  Payment Protocol Split:                             │
│  x402: 78% of calls │ MPP: 22% of calls             │
│                                                      │
│  [View on Stellar Explorer] [Export CSV] [Settings]  │
└─────────────────────────────────────────────────────┘
```

### 5. Agent-Side Demo

Show Claude Code or another MCP-enabled agent actually paying for and using the Toll-gated Watchdog Lite server on Stellar testnet.

---

## BUILD SEQUENCE

### Phase 1: Core Infrastructure (Day 1-3)

1. **Study the x402 Stellar flow thoroughly:**
   - Clone https://github.com/stellar/x402-stellar
   - Run the simple-paywall example locally (facilitator + server + client)
   - Understand the 402 response format, payment header, and verification flow
   - Read https://developers.stellar.org/docs/build/apps/x402/quickstart-guide

2. **Study the MPP Stellar SDK:**
   - Clone https://github.com/stellar-experimental/stellar-mpp-sdk
   - Run the demo examples
   - Understand Charge mode (one-time) vs Channel mode (off-chain commitments)

3. **Set up Stellar testnet wallets:**
   - Use Stellar Lab to create wallets: https://developers.stellar.org/docs/tools/lab
   - Fund with testnet XLM and USDC
   - Test a basic x402 payment flow end-to-end

4. **Build `@toll/stellar` package:**
   - X402Verifier: verify payments via facilitator
   - MPPVerifier: verify MPP session credentials
   - TransactionLogger: log all payments
   - Write tests with vitest

5. **Build `@toll/gateway` package:**
   - `withToll()` wrapper for MCP Server instances
   - `tollMiddleware()` for Express/HTTP transport
   - Config parser for toll.config.json
   - EarningsTracker (in-memory + file-based persistence)
   - RateLimiter for free tier management

### Phase 2: Demo Server (Day 3-5)

6. **Build Watchdog Lite MCP server:**
   - 3-4 tools with real (even if simple) functionality
   - Use Claude API or mock data for tool responses
   - Wrap with Toll — every tool call gated

7. **Test with x402 MCP client:**
   - Use/adapt https://github.com/jamesbachini/x402-mcp-stellar as the paying agent
   - Verify full flow: agent calls tool → gets 402 → pays on Stellar → gets result

8. **Test with MPP flow:**
   - Open MPP session → make multiple calls → session settles

### Phase 3: Dashboard (Day 5-7)

9. **Build Next.js earnings dashboard:**
   - Connect to Toll's earnings data (file-based or SQLite)
   - Show: total earnings, per-tool breakdown, recent transactions
   - Link to Stellar explorer for each tx
   - Protocol split (x402 vs MPP)
   - CSV export

### Phase 4: Polish & Demo (Day 7-10)

10. **Record demo video (2-3 min, REQUIRED):**
    - Problem → Solution → Live Demo → Impact
    - Show: configure Toll → start server → agent pays → earnings appear
11. **Write comprehensive README:**
    - Architecture diagram
    - Quick start guide
    - Config reference
    - API documentation
12. **Deploy:**
    - Demo server on a VPS or Render/Railway
    - Dashboard on Vercel
    - Ensure testnet interactions are visible on Stellar explorer

---

## DEMO VIDEO SCRIPT (2-3 minutes)

```
0:00-0:20 — The Problem
"There are thousands of MCP servers powering AI agents today.
None of them can charge for their tools. Developers build
useful AI capabilities and give them away for free."

0:20-0:40 — The Solution
"Toll is a monetization layer for MCP servers. One npm package.
One config file. Your MCP tools now earn USDC on Stellar
with every call — via x402 per-request payments or MPP sessions."

0:40-1:20 — Live Demo: Developer Side
[Screen: terminal]
"Here's a normal MCP server with 3 tools. I add Toll..."
[Show: npm install @toll/gateway]
[Show: toll.config.json with prices per tool]
[Show: one-line withToll() wrapper]
"That's it. Server is now monetized."

1:20-2:00 — Live Demo: Agent Side
[Screen: Claude Code or terminal agent]
"Now an AI agent tries to use search_competitors..."
[Show: agent gets 402 → pays 0.01 USDC on Stellar testnet → gets result]
"The agent paid. Let's check the dashboard..."
[Show: earnings dashboard updating in real-time]

2:00-2:30 — MPP Session Demo
"For high-frequency usage, agents can open an MPP session..."
[Show: session opened → 5 rapid tool calls → session settles on Stellar]
"100 calls for $1 instead of 100 separate transactions."

2:30-2:50 — Impact
"Toll turns every MCP server into a business.
x402 for per-call pricing. MPP for bulk sessions.
All settled on Stellar in under a second for fractions of a cent.
The rails are here. Now developers can get paid."
```

---

## SUBMISSION REQUIREMENTS CHECKLIST

- [ ] Open-source repo (public GitHub) with clear README
- [ ] Video demo (2-3 minutes)
- [ ] Stellar testnet interaction (x402 payments verified on-chain)
- [ ] Submit on DoraHacks before April 13, 2026

---

## WINNING EDGE: Differentiation Strategies

### 1. Dual Protocol (x402 + MPP)
Nobody else will support both. The hackathon calls out both x402 and MPP explicitly. Toll supports both with a single config toggle. This alone differentiates from every competitor building x402-only demos.

### 2. Infrastructure, Not An App
Judges consistently reward meta-layers over single-use apps (AgentFabric won $24K, CroIgnite won $2K — both were infrastructure). Toll enables thousands of paid MCP tools, not just one.

### 3. Real Working Demo
Don't just show the library — show a real MCP server (Watchdog Lite) earning real testnet USDC from a real AI agent. End-to-end proof.

### 4. Developer Experience Focus
One npm install. One config file. One wrapper function. The hackathon brief says they want things that "feel obvious in hindsight." Making MCP monetization this easy IS that.

### 5. Metered/Free Tier Pricing
Nobody else will build tiered pricing (free tier + paid overflow). This shows Toll handles real-world pricing models, not just "everything costs $X."

### 6. Earnings Dashboard
Visual proof of value. Judges can see the revenue flowing. This is the "Stripe Dashboard" moment for MCP servers.

### 7. AGNT Platform Connection
In the README/pitch, mention that Toll is being built as part of the AGNT MCP server platform vision — this signals long-term commitment, not a hackathon throwaway.

---

## KEY REFERENCE LINKS

### Hackathon Core
| Resource | URL |
|----------|-----|
| Hackathon Page | https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp |
| 3-Min Primer Video | In hackathon description |
| Stellar Hacks Telegram | Linked in hackathon |
| Stellar Dev Discord | Linked in hackathon |

### x402 on Stellar
| Resource | URL |
|----------|-----|
| x402 Stellar Monorepo | https://github.com/stellar/x402-stellar |
| x402 Stellar Docs | https://developers.stellar.org/docs/build/apps/x402 |
| x402 Quickstart Guide | https://developers.stellar.org/docs/build/apps/x402/quickstart-guide |
| x402 Facilitator Docs | https://developers.stellar.org/docs/build/apps/x402/built-on-stellar |
| x402 Live Demo | https://x402-stellar-491bf9f7e30b.herokuapp.com/ |
| x402 Test Services | https://xlm402.com |
| @x402/stellar npm | npm package for Stellar x402 integration |
| x402 Protocol Spec | https://www.x402.org/ |
| Coinbase x402 Docs | https://docs.cdp.coinbase.com/x402/docs/welcome |

### MPP on Stellar
| Resource | URL |
|----------|-----|
| Stellar MPP SDK | https://github.com/stellar-experimental/stellar-mpp-sdk |
| Stripe MPP Docs | https://docs.stripe.com/machine-payments |
| Stripe MPP Quickstart | https://docs.stripe.com/machine-payments/quickstart |
| Stripe MPP Product Page | https://stripe.com/machine-payments |
| Stripe MPP Reference Impl | https://github.com/stripe-samples/machine-payments |

### MCP + x402 (Existing Work)
| Resource | URL |
|----------|-----|
| x402 MCP Server (client-side) | https://github.com/jamesbachini/x402-mcp-stellar |
| Stellar MCP Server | https://github.com/kalepail/stellar-mcp-server |
| Stellar Observatory (x402 example) | https://github.com/elliotfriend/stellar-observatory |
| Sponsored Agent Account | https://github.com/oceans404/stellar-sponsored-agent-account |

### Stellar Dev Tools
| Resource | URL |
|----------|-----|
| Stellar Docs | https://developers.stellar.org/ |
| Stellar SDKs | https://developers.stellar.org/docs/tools/sdks |
| Stellar CLI | https://developers.stellar.org/docs/tools/cli |
| Stellar Lab | https://developers.stellar.org/docs/tools/lab |
| Stellar Wallets Kit | https://stellarwalletskit.dev/ |
| Scaffold Stellar | https://scaffoldstellar.org |
| llms.txt (for LLM context) | https://developers.stellar.org/llms.txt |

### AI Development Assistance
| Resource | URL |
|----------|-----|
| Stellar Dev Skill (Claude Code) | https://github.com/stellar/stellar-dev-skill |
| OpenZeppelin Skills | https://github.com/OpenZeppelin/openzeppelin-skills |
| Smart Account Kit | https://github.com/kalepail/smart-account-kit |
| XDR MCP Server | https://github.com/stellar-experimental/mcp-stellar-xdr |
| OpenZeppelin on Stellar | https://www.openzeppelin.com/networks/stellar |
| Free AI Setup Guide | https://github.com/kaankacar/stellar-ai-guide-mx/blob/main/Free_AI_Setup.md |

### Community & Reference Code
| Resource | URL |
|----------|-----|
| Stellar Hackathon FAQ | https://github.com/briwylde08/stellar-hackathon-faq |
| Stellar DeFi Gotchas | https://github.com/kaankacar/stellar-defi-gotchas |
| Stellar Ecosystem DB | https://github.com/lumenloop/stellar-ecosystem-db |
| Anchor Starter Pack | https://github.com/ElliotFriend/regional-starter-pack |
| AI Freighter Integration | https://github.com/carstenjacobsen/ai-freighter-integration |

---

## CRITICAL FIRST STEPS

Before writing any code:

1. **Clone and run the x402-stellar simple-paywall example end-to-end.** Get a 402 → payment → verified response working locally. This is the foundation.
   ```bash
   git clone https://github.com/stellar/x402-stellar.git
   cd x402-stellar && pnpm install && pnpm build
   # Follow the 3-terminal setup in README
   ```

2. **Clone and run the stellar-mpp-sdk demo.** Understand Charge vs Channel modes.
   ```bash
   git clone https://github.com/stellar-experimental/stellar-mpp-sdk.git
   cd stellar-mpp-sdk && pnpm install
   # Run demo examples
   ```

3. **Set up Stellar testnet wallets** via Stellar Lab. Fund with testnet XLM + USDC. You need at least 2 wallets: one for the server (receives payments) and one for the test agent (sends payments).

4. **Read the x402 MCP server code** (jamesbachini/x402-mcp-stellar) to understand how the client-side MCP payment flow works. Toll is the server-side counterpart.

5. **Install the Stellar Dev Skill for Claude Code:**
   ```
   stellar-dev:stellar-dev
   ```
   This gives Claude Code context on Stellar development patterns.

6. **Read llms.txt** for comprehensive Stellar context: https://developers.stellar.org/llms.txt

**The #1 risk is misunderstanding the x402 facilitator flow on Stellar.** x402 on Stellar uses Soroban auth entries (not raw transaction signing like on EVM chains). The facilitator service processes these. Make sure you understand this flow before building the verification layer.

---

## PROJECT NAMING

**Package name:** `@toll/gateway` + `@toll/stellar`
**Repo name:** `toll-mcp` or `toll-gateway`
**Tagline:** "The monetization layer for MCP servers"
**Domain (optional):** toll.dev, usetoll.dev, or just GitHub

---

## README STRUCTURE (for submission)

```markdown
# Toll — Monetize Your MCP Server with Stellar Payments

> One package. One config file. Your MCP tools now earn USDC.

## What is Toll?

[2-sentence description]

## Quick Start

[npm install → config → wrap → run — under 60 seconds]

## How It Works

[Architecture diagram]

## Payment Protocols

### x402 (Per-Call)
[Flow diagram + code example]

### MPP (Session-Based)
[Flow diagram + code example]

## Configuration Reference

[Full toll.config.json spec]

## Demo: Watchdog Lite

[How to run the demo server + agent]

## Earnings Dashboard

[Screenshot + how to access]

## API Reference

[withToll(), tollMiddleware(), config options]

## Built for Stellar

[Why Stellar: fast settlement, low fees, USDC infrastructure]

## Built With

[Tech stack + hackathon credits]
```
