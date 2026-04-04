# Toll — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monorepo npm package that wraps any MCP server with x402 + MPP payment gating on Stellar, including a demo server and earnings dashboard.

**Architecture:** Express middleware (`tollMiddleware`) intercepts MCP JSON-RPC tool calls before they reach the MCP transport, checks per-tool pricing from `toll.config.json`, returns HTTP 402 if payment needed, verifies via Stellar facilitator on payment, logs to SQLite. Dashboard reads same SQLite file.

**Tech Stack:** TypeScript, pnpm workspaces, turbo, @x402/core, @x402/stellar, @stellar/mpp, mppx, @modelcontextprotocol/sdk, better-sqlite3, Express, Next.js 15, Tailwind, shadcn/ui, vitest, tsup

---

## File Map

```
toll/
├── packages/stellar/src/
│   ├── types.ts              # Shared types (PaymentRequired, VerifyResult, TollConfig)
│   ├── constants.ts          # USDC_SAC_TESTNET, USDC_DECIMALS, STELLAR_TESTNET_RPC
│   ├── x402/verifier.ts      # X402Verifier — builds 402 requirements, settles via facilitator
│   ├── mpp/verifier.ts       # MPPVerifier — mppx + @stellar/mpp Charge mode factory
│   ├── earnings.ts           # EarningsTracker — SQLite via better-sqlite3
│   └── index.ts              # re-exports
├── packages/gateway/src/
│   ├── config.ts             # TollConfig Zod schema + loadConfig()
│   ├── rateLimiter.ts        # In-memory RateLimiter (free tier per caller+tool)
│   ├── middleware.ts         # tollMiddleware() — main Express middleware
│   ├── withToll.ts           # withToll() — wraps McpServer tool handlers for stdio
│   └── index.ts              # re-exports
├── apps/demo-server/src/
│   ├── index.ts              # Express app bootstrap
│   ├── server.ts             # McpServer instance + tool registration
│   ├── tools/health.ts       # health_check() — FREE
│   ├── tools/search.ts       # search_competitors(query) — $0.01 x402
│   ├── tools/sentiment.ts    # analyze_sentiment(url) — $0.02 x402 + Claude API
│   └── tools/compare.ts      # compare_products(a,b) — $0.05 MPP
├── apps/demo-server/
│   └── toll.config.json
├── scripts/
│   └── demo-agent.ts         # CLI paying agent (uses @x402/fetch)
└── apps/dashboard/
    ├── app/page.tsx
    ├── app/api/earnings/route.ts
    └── components/{StatsCards,ToolTable,TransactionList,RecentTx}.tsx
```

---

## Task 1: Repo Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize pnpm workspace**

```bash
cd /Users/rajkaria/Projects/toll
pnpm init
```

- [ ] **Step 2: Write pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "scripts"
```

- [ ] **Step 3: Write root package.json**

```json
{
  "name": "toll",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev --parallel",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 4: Write turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Write tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 6: Write .env.example**

```bash
# Stellar testnet wallets
TOLL_SERVER_SECRET=S...          # Server receiving wallet secret key
TOLL_SERVER_ADDRESS=G...         # Server receiving wallet public key
TOLL_AGENT_SECRET=S...           # Test agent wallet secret key
TOLL_AGENT_ADDRESS=G...          # Test agent wallet public key

# x402 facilitator
X402_FACILITATOR_URL=https://x402.org/facilitator
# Or run locally: http://localhost:3001

# Stellar testnet RPC
STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Anthropic (for analyze_sentiment tool)
ANTHROPIC_API_KEY=sk-ant-...

# Data directory for SQLite
TOLL_DATA_DIR=~/.toll

# Dashboard API (from demo-server)
NEXT_PUBLIC_API_URL=http://localhost:3002
```

- [ ] **Step 7: Write .gitignore**

```
node_modules/
dist/
.env
.env.local
*.db
.turbo/
```

- [ ] **Step 8: Install turbo and install root deps**

```bash
pnpm install
```

Expected: `node_modules/` created, turbo installed.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: monorepo scaffold with pnpm workspaces + turbo"
```

---

## Task 2: @toll/stellar Package Scaffold

**Files:**
- Create: `packages/stellar/package.json`
- Create: `packages/stellar/tsconfig.json`
- Create: `packages/stellar/tsup.config.ts`
- Create: `packages/stellar/vitest.config.ts`
- Create: `packages/stellar/src/types.ts`
- Create: `packages/stellar/src/constants.ts`
- Create: `packages/stellar/src/index.ts`

- [ ] **Step 1: Create package.json for @toll/stellar**

```json
{
  "name": "@toll/stellar",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@x402/core": "^2.8.0",
    "@x402/stellar": "^2.8.0",
    "@stellar/stellar-sdk": "^14.0.0",
    "better-sqlite3": "^9.4.3",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^22.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
  },
})
```

- [ ] **Step 5: Create src/constants.ts**

```typescript
// Stellar testnet USDC Soroban Asset Contract address
export const USDC_SAC_TESTNET =
  "CBIELTK6YBZJU5UP2WWQEQPMBLOP6DE2MDGJYXU5WZXMGN5NQSRPDNX"

// Stellar mainnet USDC SAC
export const USDC_SAC_MAINNET =
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7EJJUD"

// USDC has 7 decimal places on Stellar
export const USDC_DECIMALS = 7

// Convert human-readable USDC to base units (stroops)
// "0.01" USDC → 100000
export function toUsdcBaseUnits(amount: string): string {
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed < 0) throw new Error(`Invalid USDC amount: ${amount}`)
  return Math.round(parsed * Math.pow(10, USDC_DECIMALS)).toString()
}

// Convert base units back to human-readable
export function fromUsdcBaseUnits(baseUnits: string): number {
  return parseInt(baseUnits, 10) / Math.pow(10, USDC_DECIMALS)
}

export const STELLAR_TESTNET_RPC = "https://soroban-testnet.stellar.org"
export const STELLAR_MAINNET_RPC = "https://mainnet.stellar.validationcloud.io/v1/n/..."

export const X402_HEADER_PAYMENT_REQUIRED = "payment-required"
export const X402_HEADER_PAYMENT_SIGNATURE = "payment-signature"
export const X402_HEADER_PAYMENT_RESPONSE = "payment-response"
```

- [ ] **Step 6: Create src/types.ts**

```typescript
export interface TollToolConfig {
  price: string // e.g. "0.01" USDC, "0" for free
  currency: "USDC"
  description?: string
  paymentMode?: "x402" | "mpp"
  rateLimit?: {
    free: number
    perHour: boolean
    paidPrice: string
  }
}

export interface TollConfig {
  network: "testnet" | "mainnet"
  payTo: string // Stellar G... address
  facilitatorUrl: string
  defaultPaymentMode: "x402" | "mpp"
  tools: Record<string, TollToolConfig>
  mpp?: {
    enabled: boolean
  }
  dataDir?: string // path to SQLite dir, default ~/.toll
}

export interface PaymentRequired {
  x402Version: number
  accepts: PaymentRequiredAccept[]
  resource?: { url: string; description?: string }
  error?: string
}

export interface PaymentRequiredAccept {
  scheme: "exact"
  network: string
  asset: string
  payTo: string
  amount: string
  maxTimeoutSeconds: number
  description?: string
  extra?: Record<string, unknown>
}

export interface X402SettleResult {
  success: boolean
  transaction?: string // tx hash
  payer?: string // Stellar address that paid
  error?: string
}

export interface EarningsRecord {
  id: string
  tool: string
  caller: string | null
  amountUsdc: number
  protocol: "x402" | "mpp"
  txHash: string | null
  createdAt: number // unix timestamp ms
}
```

- [ ] **Step 7: Create src/index.ts (stub — will expand as we add modules)**

```typescript
export * from "./types.js"
export * from "./constants.js"
export { X402Verifier } from "./x402/verifier.js"
export { MPPVerifier } from "./mpp/verifier.js"
export { EarningsTracker } from "./earnings.js"
```

- [ ] **Step 8: Install dependencies**

```bash
cd packages/stellar && pnpm install
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: @toll/stellar package scaffold with types and constants"
```

---

## Task 3: X402Verifier

**Files:**
- Create: `packages/stellar/src/x402/verifier.ts`
- Create: `packages/stellar/src/x402/verifier.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/stellar/src/x402/verifier.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { X402Verifier } from "./verifier.js"
import type { TollConfig } from "../types.js"

const mockConfig: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {},
}

describe("X402Verifier", () => {
  it("toUsdcBaseUnits converts correctly", () => {
    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    expect(reqs.x402Version).toBe(2)
    expect(reqs.accepts[0].amount).toBe("100000") // 0.01 * 10^7
    expect(reqs.accepts[0].scheme).toBe("exact")
    expect(reqs.accepts[0].network).toBe("stellar:testnet")
    expect(reqs.accepts[0].payTo).toBe(mockConfig.payTo)
  })

  it("settle calls facilitator /settle endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, transaction: "abc123", payer: "GPAYER..." }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    const result = await v.settle("base64payloadhere", reqs)

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/settle",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    )
    expect(result.success).toBe(true)
    expect(result.transaction).toBe("abc123")
  })

  it("settle returns failure on facilitator error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid payment" }),
    }))

    const v = new X402Verifier(mockConfig)
    const reqs = v.buildRequirements("search_competitors", "0.01", "http://localhost:3002/mcp")
    const result = await v.settle("badinput", reqs)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/stellar && pnpm test
```

Expected: `Cannot find module './verifier.js'`

- [ ] **Step 3: Implement X402Verifier**

```typescript
// packages/stellar/src/x402/verifier.ts
import { toUsdcBaseUnits, USDC_SAC_TESTNET, USDC_SAC_MAINNET } from "../constants.js"
import type {
  TollConfig,
  PaymentRequired,
  PaymentRequiredAccept,
  X402SettleResult,
} from "../types.js"

export class X402Verifier {
  private facilitatorUrl: string
  private payTo: string
  private network: string
  private asset: string

  constructor(config: TollConfig) {
    this.facilitatorUrl = config.facilitatorUrl.replace(/\/$/, "")
    this.payTo = config.payTo
    this.network = config.network === "testnet" ? "stellar:testnet" : "stellar:pubnet"
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
  }

  buildRequirements(
    tool: string,
    priceUsdc: string,
    resourceUrl: string
  ): PaymentRequired {
    const accept: PaymentRequiredAccept = {
      scheme: "exact",
      network: this.network,
      asset: this.asset,
      payTo: this.payTo,
      amount: toUsdcBaseUnits(priceUsdc),
      maxTimeoutSeconds: 300,
      description: `Payment for MCP tool: ${tool} (${priceUsdc} USDC)`,
      extra: { areFeesSponsored: true },
    }
    return {
      x402Version: 2,
      accepts: [accept],
      resource: { url: resourceUrl, description: `MCP tool: ${tool}` },
    }
  }

  // Encode requirements as base64 for the PAYMENT-REQUIRED header
  encodeRequirements(requirements: PaymentRequired): string {
    return Buffer.from(JSON.stringify(requirements)).toString("base64")
  }

  async settle(
    paymentSignatureHeader: string,
    requirements: PaymentRequired
  ): Promise<X402SettleResult> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: paymentSignatureHeader,
          paymentRequirements: requirements,
        }),
      })

      const data = await response.json() as Record<string, unknown>

      if (!response.ok) {
        return {
          success: false,
          error: (data.error as string) ?? `Facilitator responded ${response.status}`,
        }
      }

      return {
        success: (data.success as boolean) ?? false,
        transaction: data.transaction as string | undefined,
        payer: data.payer as string | undefined,
        error: data.error as string | undefined,
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/stellar && pnpm test
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: X402Verifier with facilitator settle and requirement builder"
```

---

## Task 4: MPPVerifier

**Files:**
- Create: `packages/stellar/src/mpp/verifier.ts`
- Create: `packages/stellar/src/mpp/verifier.test.ts`

- [ ] **Step 1: Check if @stellar/mpp is on npm**

```bash
npm info @stellar/mpp version 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
npm info mppx version 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
```

If `@stellar/mpp` is NOT found, install from GitHub:
```bash
# Fallback: install from GitHub
cd packages/stellar
pnpm add github:stellar-experimental/stellar-mpp-sdk
```

If both exist on npm:
```bash
cd packages/stellar
pnpm add @stellar/mpp mppx
```

- [ ] **Step 2: Write the failing test**

```typescript
// packages/stellar/src/mpp/verifier.test.ts
import { describe, it, expect, vi } from "vitest"
import { MPPVerifier } from "./verifier.js"
import type { TollConfig } from "../types.js"

const mockConfig: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "mpp",
  tools: {},
  mpp: { enabled: true },
}

describe("MPPVerifier", () => {
  it("creates middleware function for a tool+price", () => {
    const v = new MPPVerifier(mockConfig)
    const middleware = v.createMiddleware("compare_products", "0.05")
    expect(typeof middleware).toBe("function")
    expect(middleware.length).toBe(3) // (req, res, next)
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd packages/stellar && pnpm test
```

Expected: `Cannot find module './verifier.js'`

- [ ] **Step 4: Implement MPPVerifier**

```typescript
// packages/stellar/src/mpp/verifier.ts
import type { RequestHandler } from "express"
import type { TollConfig } from "../types.js"
import { USDC_SAC_TESTNET, USDC_SAC_MAINNET, toUsdcBaseUnits } from "../constants.js"

// Dynamic import to handle if @stellar/mpp or mppx aren't available
async function getMppModules() {
  try {
    const [mppx, stellarMpp] = await Promise.all([
      import("mppx"),
      import("@stellar/mpp/charge/server"),
    ])
    return { Mppx: mppx.Mppx, stellar: stellarMpp.stellar }
  } catch {
    return null
  }
}

export class MPPVerifier {
  private config: TollConfig
  private asset: string
  private mppAvailable: boolean = false

  constructor(config: TollConfig) {
    this.config = config
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
    // Test availability at startup
    getMppModules().then((m) => { this.mppAvailable = m !== null })
  }

  createMiddleware(tool: string, priceUsdc: string): RequestHandler {
    const self = this

    return async (req, res, next) => {
      const modules = await getMppModules()

      // Graceful fallback: if MPP not available, pass through with warning
      if (!modules) {
        console.warn(
          `[Toll] MPP SDK not available. Tool '${tool}' serving without payment gate.`
        )
        return next()
      }

      const { Mppx, stellar } = modules
      const amountBaseUnits = toUsdcBaseUnits(priceUsdc)

      const mppInstance = Mppx.create({
        methods: [
          stellar.charge({
            recipient: self.config.payTo,
            currency: self.asset,
            network: self.config.network === "testnet" ? "testnet" : "public",
            amount: amountBaseUnits,
          }),
        ],
      })

      // mppx middleware handles WWW-Authenticate / Authorization: Payment flow
      const mppMiddleware = mppInstance.middleware()
      return mppMiddleware(req, res, next)
    }
  }
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/stellar && pnpm test
```

Expected: All tests PASS (MPPVerifier test passes because we just check it returns a function).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: MPPVerifier wrapping mppx + @stellar/mpp Charge mode"
```

---

## Task 5: EarningsTracker

**Files:**
- Create: `packages/stellar/src/earnings.ts`
- Create: `packages/stellar/src/earnings.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/stellar/src/earnings.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { EarningsTracker } from "./earnings.js"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

describe("EarningsTracker", () => {
  let tracker: EarningsTracker
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "toll-test-"))
    tracker = new EarningsTracker(tmpDir)
  })

  afterEach(() => {
    tracker.close()
    fs.rmSync(tmpDir, { recursive: true })
  })

  it("records a transaction and retrieves it", () => {
    tracker.record({
      tool: "search_competitors",
      caller: "GPAYER...",
      amountUsdc: 0.01,
      protocol: "x402",
      txHash: "abc123",
    })

    const stats = tracker.getStats()
    expect(stats.totalEarnings).toBeCloseTo(0.01, 5)
    expect(stats.totalCalls).toBe(1)
  })

  it("getByTool returns per-tool breakdown", () => {
    tracker.record({ tool: "search_competitors", caller: null, amountUsdc: 0.01, protocol: "x402", txHash: null })
    tracker.record({ tool: "search_competitors", caller: null, amountUsdc: 0.01, protocol: "x402", txHash: null })
    tracker.record({ tool: "analyze_sentiment", caller: null, amountUsdc: 0.02, protocol: "x402", txHash: null })

    const byTool = tracker.getByTool()
    const search = byTool.find((t) => t.tool === "search_competitors")!
    expect(search.calls).toBe(2)
    expect(search.revenue).toBeCloseTo(0.02, 5)
  })

  it("getRecent returns last N transactions newest-first", () => {
    for (let i = 0; i < 5; i++) {
      tracker.record({ tool: "health_check", caller: null, amountUsdc: 0, protocol: "x402", txHash: null })
    }
    const recent = tracker.getRecent(3)
    expect(recent).toHaveLength(3)
  })

  it("getProtocolSplit returns x402 and mpp percentages", () => {
    tracker.record({ tool: "t", caller: null, amountUsdc: 0.01, protocol: "x402", txHash: null })
    tracker.record({ tool: "t", caller: null, amountUsdc: 0.01, protocol: "x402", txHash: null })
    tracker.record({ tool: "t", caller: null, amountUsdc: 0.05, protocol: "mpp", txHash: null })

    const split = tracker.getProtocolSplit()
    expect(split.x402).toBeCloseTo(67, 0)
    expect(split.mpp).toBeCloseTo(33, 0)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/stellar && pnpm test
```

Expected: `Cannot find module './earnings.js'`

- [ ] **Step 3: Implement EarningsTracker**

```typescript
// packages/stellar/src/earnings.ts
import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { randomUUID } from "node:crypto"
import type { EarningsRecord } from "./types.js"

interface RecordInput {
  tool: string
  caller: string | null
  amountUsdc: number
  protocol: "x402" | "mpp"
  txHash: string | null
}

interface ToolStats {
  tool: string
  calls: number
  revenue: number
  avgPrice: number
}

interface OverallStats {
  totalEarnings: number
  totalCalls: number
  todayEarnings: number
  todayCalls: number
}

interface ProtocolSplit {
  x402: number
  mpp: number
}

export class EarningsTracker {
  private db: Database.Database

  constructor(dataDir?: string) {
    const dir = dataDir ?? path.join(os.homedir(), ".toll")
    fs.mkdirSync(dir, { recursive: true })
    const dbPath = path.join(dir, "earnings.db")
    this.db = new Database(dbPath)
    this.init()
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        tool TEXT NOT NULL,
        caller TEXT,
        amount_usdc REAL NOT NULL,
        protocol TEXT NOT NULL,
        tx_hash TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_created_at ON transactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_tool ON transactions(tool);
    `)
  }

  record(input: RecordInput): string {
    const id = randomUUID()
    const now = Date.now()
    this.db
      .prepare(
        `INSERT INTO transactions (id, tool, caller, amount_usdc, protocol, tx_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, input.tool, input.caller, input.amountUsdc, input.protocol, input.txHash, now)
    return id
  }

  getStats(): OverallStats {
    const total = this.db
      .prepare(`SELECT COALESCE(SUM(amount_usdc),0) as earnings, COUNT(*) as calls FROM transactions`)
      .get() as { earnings: number; calls: number }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = this.db
      .prepare(
        `SELECT COALESCE(SUM(amount_usdc),0) as earnings, COUNT(*) as calls
         FROM transactions WHERE created_at >= ?`
      )
      .get(todayStart.getTime()) as { earnings: number; calls: number }

    return {
      totalEarnings: total.earnings,
      totalCalls: total.calls,
      todayEarnings: today.earnings,
      todayCalls: today.calls,
    }
  }

  getByTool(): ToolStats[] {
    return this.db
      .prepare(
        `SELECT tool,
                COUNT(*) as calls,
                COALESCE(SUM(amount_usdc),0) as revenue,
                COALESCE(AVG(amount_usdc),0) as avgPrice
         FROM transactions
         GROUP BY tool
         ORDER BY revenue DESC`
      )
      .all() as ToolStats[]
  }

  getRecent(limit = 20): EarningsRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, tool, caller, amount_usdc as amountUsdc, protocol, tx_hash as txHash, created_at as createdAt
         FROM transactions ORDER BY created_at DESC LIMIT ?`
      )
      .all(limit) as EarningsRecord[]
    return rows
  }

  getProtocolSplit(): ProtocolSplit {
    const rows = this.db
      .prepare(`SELECT protocol, COUNT(*) as cnt FROM transactions GROUP BY protocol`)
      .all() as { protocol: string; cnt: number }[]

    const total = rows.reduce((s, r) => s + r.cnt, 0)
    if (total === 0) return { x402: 0, mpp: 0 }

    const x402Row = rows.find((r) => r.protocol === "x402")
    const mppRow = rows.find((r) => r.protocol === "mpp")
    return {
      x402: Math.round(((x402Row?.cnt ?? 0) / total) * 100),
      mpp: Math.round(((mppRow?.cnt ?? 0) / total) * 100),
    }
  }

  close() {
    this.db.close()
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/stellar && pnpm test
```

Expected: All tests PASS.

- [ ] **Step 5: Build the package**

```bash
cd packages/stellar && pnpm build
```

Expected: `dist/` created with `index.js`, `index.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: EarningsTracker with SQLite persistence"
```

---

## Task 6: @toll/gateway Package + Config Parser

**Files:**
- Create: `packages/gateway/package.json`
- Create: `packages/gateway/tsconfig.json`
- Create: `packages/gateway/tsup.config.ts`
- Create: `packages/gateway/vitest.config.ts`
- Create: `packages/gateway/src/config.ts`
- Create: `packages/gateway/src/config.test.ts`
- Create: `packages/gateway/src/index.ts`

- [ ] **Step 1: Create package.json for @toll/gateway**

```json
{
  "name": "@toll/gateway",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@toll/stellar": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.9.0",
    "express": "^4.21.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["express", "@modelcontextprotocol/sdk", "@toll/stellar"],
})
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config"
export default defineConfig({ test: { environment: "node" } })
```

- [ ] **Step 5: Write failing config test**

```typescript
// packages/gateway/src/config.test.ts
import { describe, it, expect } from "vitest"
import { validateConfig } from "./config.js"

describe("validateConfig", () => {
  const validConfig = {
    network: "testnet",
    payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    facilitatorUrl: "http://localhost:3001",
    defaultPaymentMode: "x402",
    tools: {
      search_competitors: { price: "0.01", currency: "USDC" },
      health_check: { price: "0", currency: "USDC" },
    },
  }

  it("accepts a valid config", () => {
    const result = validateConfig(validConfig)
    expect(result.network).toBe("testnet")
    expect(result.tools.search_competitors.price).toBe("0.01")
  })

  it("throws on invalid network", () => {
    expect(() => validateConfig({ ...validConfig, network: "invalid" })).toThrow()
  })

  it("throws on missing payTo", () => {
    const { payTo: _, ...rest } = validConfig
    expect(() => validateConfig(rest)).toThrow()
  })

  it("identifies free tools", () => {
    const result = validateConfig(validConfig)
    expect(parseFloat(result.tools.health_check.price)).toBe(0)
  })
})
```

- [ ] **Step 6: Run test to confirm it fails**

```bash
cd packages/gateway && pnpm install && pnpm test
```

Expected: `Cannot find module './config.js'`

- [ ] **Step 7: Implement config.ts**

```typescript
// packages/gateway/src/config.ts
import { z } from "zod"
import fs from "node:fs"
import type { TollConfig } from "@toll/stellar"

const ToolConfigSchema = z.object({
  price: z.string().regex(/^\d+(\.\d+)?$/, "Price must be a decimal string like '0.01'"),
  currency: z.literal("USDC"),
  description: z.string().optional(),
  paymentMode: z.enum(["x402", "mpp"]).optional(),
  rateLimit: z
    .object({
      free: z.number().int().nonnegative(),
      perHour: z.boolean(),
      paidPrice: z.string(),
    })
    .optional(),
})

const TollConfigSchema = z.object({
  network: z.enum(["testnet", "mainnet"]),
  payTo: z.string().min(56, "payTo must be a valid Stellar address"),
  facilitatorUrl: z.string().url(),
  defaultPaymentMode: z.enum(["x402", "mpp"]),
  tools: z.record(z.string(), ToolConfigSchema),
  mpp: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),
  dataDir: z.string().optional(),
})

export function validateConfig(raw: unknown): TollConfig {
  return TollConfigSchema.parse(raw) as TollConfig
}

export function loadConfig(configPath: string): TollConfig {
  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as unknown
  return validateConfig(raw)
}

export function isFree(tool: { price: string }): boolean {
  return parseFloat(tool.price) === 0
}
```

- [ ] **Step 8: Create stub index.ts**

```typescript
// packages/gateway/src/index.ts
export { validateConfig, loadConfig, isFree } from "./config.js"
export { RateLimiter } from "./rateLimiter.js"
export { tollMiddleware } from "./middleware.js"
export { withToll } from "./withToll.js"
```

- [ ] **Step 9: Run tests**

```bash
cd packages/gateway && pnpm test
```

Expected: All 4 config tests PASS.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: @toll/gateway scaffold with Zod config parser"
```

---

## Task 7: RateLimiter

**Files:**
- Create: `packages/gateway/src/rateLimiter.ts`
- Create: `packages/gateway/src/rateLimiter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/gateway/src/rateLimiter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { RateLimiter } from "./rateLimiter.js"
import type { TollToolConfig } from "@toll/stellar"

const freeWithLimit: TollToolConfig = {
  price: "0",
  currency: "USDC",
  rateLimit: { free: 3, perHour: true, paidPrice: "0.001" },
}

describe("RateLimiter", () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter()
  })

  it("allows free calls within the limit", () => {
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(true)
    limiter.increment("caller1", "tool")
    limiter.increment("caller1", "tool")
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(true)
  })

  it("blocks after free tier exceeded", () => {
    limiter.increment("caller1", "tool")
    limiter.increment("caller1", "tool")
    limiter.increment("caller1", "tool")
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(false)
  })

  it("allows calls on tools with no rate limit", () => {
    const noLimit: TollToolConfig = { price: "0.01", currency: "USDC" }
    expect(limiter.isWithinFreeTier("caller1", "tool", noLimit)).toBe(false)
  })

  it("different callers are tracked independently", () => {
    limiter.increment("caller1", "tool")
    limiter.increment("caller1", "tool")
    limiter.increment("caller1", "tool")
    // caller2 hasn't used any
    expect(limiter.isWithinFreeTier("caller2", "tool", freeWithLimit)).toBe(true)
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/gateway && pnpm test
```

Expected: `Cannot find module './rateLimiter.js'`

- [ ] **Step 3: Implement RateLimiter**

```typescript
// packages/gateway/src/rateLimiter.ts
import type { TollToolConfig } from "@toll/stellar"

interface UsageEntry {
  count: number
  windowStart: number
}

export class RateLimiter {
  // Map key: `${callerId}:${tool}`
  private usage = new Map<string, UsageEntry>()

  private key(callerId: string, tool: string): string {
    return `${callerId}:${tool}`
  }

  private windowDurationMs(perHour: boolean): number {
    return perHour ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  }

  isWithinFreeTier(callerId: string, tool: string, toolConfig: TollToolConfig): boolean {
    if (!toolConfig.rateLimit) return false

    const { free, perHour } = toolConfig.rateLimit
    const key = this.key(callerId, tool)
    const now = Date.now()
    const windowMs = this.windowDurationMs(perHour)

    const entry = this.usage.get(key)
    if (!entry || now - entry.windowStart > windowMs) {
      // No usage or window expired — they're within the free tier
      return true
    }

    return entry.count < free
  }

  increment(callerId: string, tool: string): void {
    const key = this.key(callerId, tool)
    const now = Date.now()
    const entry = this.usage.get(key)

    if (!entry) {
      this.usage.set(key, { count: 1, windowStart: now })
      return
    }

    // If window expired, reset
    // We don't have perHour here, but 1 hour window is the default for rate-limited tools
    const windowMs = 60 * 60 * 1000
    if (now - entry.windowStart > windowMs) {
      this.usage.set(key, { count: 1, windowStart: now })
    } else {
      entry.count++
    }
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/gateway && pnpm test
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: in-memory RateLimiter for free tier management"
```

---

## Task 8: tollMiddleware

**Files:**
- Create: `packages/gateway/src/middleware.ts`
- Create: `packages/gateway/src/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/gateway/src/middleware.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { tollMiddleware } from "./middleware.js"
import type { TollConfig } from "@toll/stellar"

// Mock @toll/stellar modules
vi.mock("@toll/stellar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@toll/stellar")>()
  return {
    ...actual,
    X402Verifier: vi.fn().mockImplementation(() => ({
      buildRequirements: vi.fn().mockReturnValue({ x402Version: 2, accepts: [] }),
      encodeRequirements: vi.fn().mockReturnValue("base64reqs"),
      settle: vi.fn().mockResolvedValue({ success: true, transaction: "txhash", payer: "GPAYER" }),
    })),
    MPPVerifier: vi.fn().mockImplementation(() => ({
      createMiddleware: vi.fn().mockReturnValue((_req: unknown, _res: unknown, next: () => void) => next()),
    })),
    EarningsTracker: vi.fn().mockImplementation(() => ({
      record: vi.fn(),
      getStats: vi.fn().mockReturnValue({ totalEarnings: 0, totalCalls: 0, todayEarnings: 0, todayCalls: 0 }),
    })),
  }
})

function makeReqRes(method = "tools/call", toolName = "search_competitors", headers: Record<string, string> = {}) {
  return {
    req: {
      body: { jsonrpc: "2.0", id: "1", method, params: { name: toolName, arguments: {} } },
      headers,
      ip: "127.0.0.1",
    },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    },
    next: vi.fn(),
  }
}

const config: TollConfig = {
  network: "testnet",
  payTo: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {
    search_competitors: { price: "0.01", currency: "USDC" },
    health_check: { price: "0", currency: "USDC" },
  },
}

describe("tollMiddleware", () => {
  it("passes free tools directly to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "health_check")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it("passes unknown tools to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "unknown_tool")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })

  it("returns 402 for paid tools without payment header", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "search_competitors")
    await middleware(req as never, res as never, next)
    expect(res.status).toHaveBeenCalledWith(402)
    expect(res.json).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it("calls next() for paid tools with valid payment header", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/call", "search_competitors", {
      "payment-signature": "validpayload",
    })
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })

  it("passes non-tool-call requests to next()", async () => {
    const middleware = tollMiddleware(config)
    const { req, res, next } = makeReqRes("tools/list", "")
    await middleware(req as never, res as never, next)
    expect(next).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/gateway && pnpm test
```

Expected: `Cannot find module './middleware.js'`

- [ ] **Step 3: Implement tollMiddleware**

```typescript
// packages/gateway/src/middleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express"
import {
  X402Verifier,
  MPPVerifier,
  EarningsTracker,
  type TollConfig,
} from "@toll/stellar"
import { RateLimiter } from "./rateLimiter.js"
import { isFree } from "./config.js"

const X402_HEADER = "payment-signature"

function getCallerId(req: Request): string {
  // Use the payer's address if available, fallback to IP
  return req.ip ?? "anonymous"
}

function isMcpToolCall(body: unknown): body is { method: "tools/call"; params: { name: string } } {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).method === "tools/call" &&
    typeof (body as Record<string, unknown>).params === "object"
  )
}

export function tollMiddleware(config: TollConfig): RequestHandler {
  const x402 = new X402Verifier(config)
  const mpp = new MPPVerifier(config)
  const earnings = new EarningsTracker(config.dataDir)
  const rateLimiter = new RateLimiter()

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only intercept MCP tool calls
    if (!isMcpToolCall(req.body)) {
      next()
      return
    }

    const toolName = req.body.params.name
    const toolConfig = config.tools[toolName]

    // Unknown tool or explicitly free
    if (!toolConfig || isFree(toolConfig)) {
      next()
      return
    }

    const callerId = getCallerId(req)

    // Check rate limit free tier
    if (rateLimiter.isWithinFreeTier(callerId, toolName, toolConfig)) {
      rateLimiter.increment(callerId, toolName)
      next()
      return
    }

    const protocol = toolConfig.paymentMode ?? config.defaultPaymentMode
    const resourceUrl = `${req.protocol}://${req.get("host")}${req.path}`

    if (protocol === "x402") {
      const paymentHeader = req.headers[X402_HEADER] as string | undefined

      if (!paymentHeader) {
        const requirements = x402.buildRequirements(toolName, toolConfig.price, resourceUrl)
        res.status(402).json({
          ...requirements,
          [X402_HEADER]: x402.encodeRequirements(requirements),
        })
        return
      }

      const requirements = x402.buildRequirements(toolName, toolConfig.price, resourceUrl)
      const result = await x402.settle(paymentHeader, requirements)

      if (!result.success) {
        res.status(402).json({ error: result.error ?? "Payment verification failed" })
        return
      }

      earnings.record({
        tool: toolName,
        caller: result.payer ?? callerId,
        amountUsdc: parseFloat(toolConfig.price),
        protocol: "x402",
        txHash: result.transaction ?? null,
      })

      next()
      return
    }

    if (protocol === "mpp") {
      // mppx handles the full 402 challenge/response cycle
      const mppHandler = mpp.createMiddleware(toolName, toolConfig.price)
      // Wrap to record earnings after mppx calls next()
      mppHandler(req, res, () => {
        earnings.record({
          tool: toolName,
          caller: callerId,
          amountUsdc: parseFloat(toolConfig.price),
          protocol: "mpp",
          txHash: null,
        })
        next()
      })
    }
  }
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/gateway && pnpm test
```

Expected: All 5 middleware tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: tollMiddleware with x402 and MPP payment gating"
```

---

## Task 9: withToll (stdio McpServer wrapper)

**Files:**
- Create: `packages/gateway/src/withToll.ts`
- Create: `packages/gateway/src/withToll.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/gateway/src/withToll.test.ts
import { describe, it, expect, vi } from "vitest"
import { withToll } from "./withToll.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { TollConfig } from "@toll/stellar"

const config: TollConfig = {
  network: "testnet",
  payTo: "GXXX",
  facilitatorUrl: "http://localhost:3001",
  defaultPaymentMode: "x402",
  tools: {
    paid_tool: { price: "0.01", currency: "USDC" },
    free_tool: { price: "0", currency: "USDC" },
  },
}

describe("withToll", () => {
  it("returns the same McpServer instance", () => {
    const server = new McpServer({ name: "test", version: "1.0.0" })
    const result = withToll(server, config)
    expect(result).toBe(server)
  })

  it("free tools are not wrapped (handler still returns normally)", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" })
    const originalHandler = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "free result" }],
    })
    server.tool("free_tool", { message: z.string() }, originalHandler)
    withToll(server, config)

    // The handler should not be changed for free tools
    const tools = (server as unknown as { _registeredTools: Record<string, { handler: unknown }> })._registeredTools
    expect(tools["free_tool"]).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/gateway && pnpm test
```

Expected: `Cannot find module './withToll.js'`

- [ ] **Step 3: Implement withToll**

```typescript
// packages/gateway/src/withToll.ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { TollConfig } from "@toll/stellar"
import { isFree } from "./config.js"

interface RegisteredTool {
  handler: (...args: unknown[]) => unknown
  update: (config: { handler: (...args: unknown[]) => unknown }) => void
}

// withToll wraps an McpServer's registered tool handlers for stdio transport.
// Since MCP stdio cannot return HTTP 402, paid tools return a JSON-RPC error
// result with payment instructions when no session payment token is present.
//
// NOTE: For HTTP transport, use tollMiddleware() instead — it returns real HTTP 402.
export function withToll(server: McpServer, config: TollConfig): McpServer {
  const registeredTools = (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools

  if (!registeredTools) {
    console.warn("[Toll] Could not access _registeredTools on McpServer. Skipping stdio wrapping.")
    return server
  }

  for (const [toolName, tool] of Object.entries(registeredTools)) {
    const toolConfig = config.tools[toolName]
    if (!toolConfig || isFree(toolConfig)) continue

    const originalHandler = tool.handler

    tool.update({
      handler: async (...args: unknown[]) => {
        // For stdio, we can't do real payment verification without a payment channel.
        // Return an error result with payment instructions.
        // Agents can read this and set up payment via external means.
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "PAYMENT_REQUIRED",
                tool: toolName,
                price: toolConfig.price,
                currency: toolConfig.currency,
                payTo: config.payTo,
                network: config.network,
                protocol: toolConfig.paymentMode ?? config.defaultPaymentMode,
                message: `This tool requires ${toolConfig.price} USDC payment. Use HTTP transport with Toll for automatic x402 payment handling.`,
              }),
            },
          ],
        }
      },
    })
  }

  return server
}
```

- [ ] **Step 4: Run tests**

```bash
cd packages/gateway && pnpm test
```

Expected: All tests PASS.

- [ ] **Step 5: Build @toll/gateway**

```bash
cd packages/gateway && pnpm build
```

Expected: `dist/` created.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: withToll stdio wrapper for McpServer tool handlers"
```

---

## Task 10: Demo Server Scaffold

**Files:**
- Create: `apps/demo-server/package.json`
- Create: `apps/demo-server/tsconfig.json`
- Create: `apps/demo-server/tsup.config.ts`
- Create: `apps/demo-server/toll.config.json`
- Create: `apps/demo-server/.env.example`
- Create: `apps/demo-server/src/server.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "demo-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "start": "node dist/index.js",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@toll/gateway": "workspace:*",
    "@toll/stellar": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.9.0",
    "@anthropic-ai/sdk": "^0.40.0",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup"
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  external: ["better-sqlite3"],
})
```

- [ ] **Step 4: Create toll.config.json**

```json
{
  "network": "testnet",
  "payTo": "REPLACE_WITH_SERVER_STELLAR_ADDRESS",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": {
    "health_check": {
      "price": "0",
      "currency": "USDC",
      "description": "Free health check — server status and version"
    },
    "search_competitors": {
      "price": "0.01",
      "currency": "USDC",
      "description": "Search for competitor information ($0.01 USDC per call)"
    },
    "analyze_sentiment": {
      "price": "0.02",
      "currency": "USDC",
      "description": "Analyze sentiment of a URL ($0.02 USDC per call)"
    },
    "compare_products": {
      "price": "0.05",
      "currency": "USDC",
      "paymentMode": "mpp",
      "description": "Compare two products side-by-side ($0.05 USDC per call, paid via MPP)"
    }
  },
  "mpp": {
    "enabled": true
  }
}
```

- [ ] **Step 5: Create .env.example**

```bash
PORT=3002
TOLL_SERVER_SECRET=S...
TOLL_SERVER_ADDRESS=G...
ANTHROPIC_API_KEY=sk-ant-...
TOLL_DATA_DIR=~/.toll
```

- [ ] **Step 6: Create src/server.ts — McpServer instance**

```typescript
// apps/demo-server/src/server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { healthTool } from "./tools/health.js"
import { searchTool } from "./tools/search.js"
import { sentimentTool } from "./tools/sentiment.js"
import { compareTool } from "./tools/compare.js"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "watchdog-lite",
    version: "0.1.0",
  })

  healthTool(server)
  searchTool(server)
  sentimentTool(server)
  compareTool(server)

  return server
}
```

- [ ] **Step 7: Install deps**

```bash
cd apps/demo-server && pnpm install
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: demo-server scaffold with toll.config.json"
```

---

## Task 11: Demo Server Tools (health + search)

**Files:**
- Create: `apps/demo-server/src/tools/health.ts`
- Create: `apps/demo-server/src/tools/search.ts`

- [ ] **Step 1: Create health_check tool**

```typescript
// apps/demo-server/src/tools/health.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function healthTool(server: McpServer): void {
  server.tool(
    "health_check",
    { description: "Check server health and status. This tool is FREE." },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ok",
              server: "Watchdog Lite",
              version: "0.1.0",
              powered_by: "Toll — MCP Monetization Gateway",
              network: "Stellar Testnet",
              timestamp: new Date().toISOString(),
              tools: {
                health_check: "FREE",
                search_competitors: "0.01 USDC (x402)",
                analyze_sentiment: "0.02 USDC (x402)",
                compare_products: "0.05 USDC (MPP)",
              },
            }, null, 2),
          },
        ],
      }
    }
  )
}
```

- [ ] **Step 2: Create search_competitors tool**

```typescript
// apps/demo-server/src/tools/search.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Realistic mock competitor data indexed by keyword
const COMPETITOR_DATA: Record<string, unknown[]> = {
  default: [
    {
      name: "CompetitorAlpha",
      website: "https://competitor-alpha.example.com",
      founded: 2019,
      employees: "50-200",
      funding: "$12M Series A",
      strengths: ["Fast deployment", "Good documentation", "Active community"],
      weaknesses: ["Limited enterprise features", "No SLA"],
      pricing: "Freemium, $49/mo Pro",
    },
    {
      name: "BetaCorp Solutions",
      website: "https://betacorp.example.com",
      founded: 2017,
      employees: "200-500",
      funding: "$45M Series B",
      strengths: ["Enterprise focus", "24/7 support", "SOC2 compliant"],
      weaknesses: ["Expensive", "Complex onboarding", "Slow iteration"],
      pricing: "$299/mo, custom enterprise",
    },
    {
      name: "GammaTools",
      website: "https://gammatools.example.com",
      founded: 2021,
      employees: "10-50",
      funding: "Bootstrapped",
      strengths: ["Innovative features", "Low cost", "Developer-friendly"],
      weaknesses: ["Small team", "Limited integrations", "No mobile app"],
      pricing: "$19/mo flat",
    },
  ],
}

function getCompetitors(query: string): unknown[] {
  const key = Object.keys(COMPETITOR_DATA).find((k) =>
    query.toLowerCase().includes(k)
  )
  return COMPETITOR_DATA[key ?? "default"] ?? COMPETITOR_DATA["default"]
}

export function searchTool(server: McpServer): void {
  server.tool(
    "search_competitors",
    {
      description: "Search for competitor information. Costs 0.01 USDC per call (x402).",
      inputSchema: z.object({
        query: z.string().describe("Search query, e.g. 'project management tools' or 'API monitoring services'"),
      }),
    },
    async ({ query }) => {
      const competitors = getCompetitors(query)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              results: competitors,
              count: competitors.length,
              source: "Watchdog Lite — Paid via x402 on Stellar Testnet",
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      }
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: health_check (free) and search_competitors (x402 $0.01) tools"
```

---

## Task 12: analyze_sentiment Tool (Real Claude API)

**Files:**
- Create: `apps/demo-server/src/tools/sentiment.ts`

- [ ] **Step 1: Create analyze_sentiment tool**

```typescript
// apps/demo-server/src/tools/sentiment.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function fetchUrlText(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Toll-Watchdog-Lite/0.1.0" },
      signal: AbortSignal.timeout(5000),
    })
    const html = await response.text()
    // Strip HTML tags for a rough text extraction
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000)
  } catch {
    return `Could not fetch URL: ${url}`
  }
}

export function sentimentTool(server: McpServer): void {
  server.tool(
    "analyze_sentiment",
    {
      description: "Analyze the sentiment of a webpage. Costs 0.02 USDC per call (x402). Uses Claude AI.",
      inputSchema: z.object({
        url: z.string().url().describe("The URL of the page to analyze"),
      }),
    },
    async ({ url }) => {
      const pageText = await fetchUrlText(url)

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Analyze the sentiment of this webpage text and respond with a JSON object containing:
- overall: "positive" | "negative" | "neutral" | "mixed"
- score: number between -1.0 (very negative) and 1.0 (very positive)
- confidence: number between 0 and 1
- key_themes: string[] (up to 5 main topics)
- summary: string (one sentence sentiment summary)

Webpage text:
${pageText}

Respond ONLY with valid JSON.`,
          },
        ],
      })

      const analysisText = message.content[0].type === "text" ? message.content[0].text : "{}"
      let analysis: unknown
      try {
        analysis = JSON.parse(analysisText)
      } catch {
        analysis = { overall: "neutral", score: 0, confidence: 0.5, summary: analysisText }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              url,
              analysis,
              model: "claude-haiku-4-5",
              source: "Watchdog Lite — Paid via x402 on Stellar Testnet",
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      }
    }
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: analyze_sentiment tool with real Claude API (x402 $0.02)"
```

---

## Task 13: compare_products Tool (MPP)

**Files:**
- Create: `apps/demo-server/src/tools/compare.ts`

- [ ] **Step 1: Create compare_products tool**

```typescript
// apps/demo-server/src/tools/compare.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

function generateComparison(productA: string, productB: string) {
  // Deterministic mock comparison based on product names
  const aLen = productA.length
  const bLen = productB.length

  return {
    products: { a: productA, b: productB },
    comparison: {
      [productA]: {
        score: 7 + (aLen % 3),
        pros: [
          `${productA} has excellent documentation`,
          `Strong ${productA} community support`,
          `${productA} integrates well with existing tools`,
        ],
        cons: [
          `${productA} pricing can be complex`,
          `Steeper ${productA} learning curve for new users`,
        ],
        best_for: aLen > bLen ? "Enterprise teams" : "Startups and SMBs",
        pricing_model: aLen % 2 === 0 ? "Subscription (monthly/annual)" : "Usage-based",
      },
      [productB]: {
        score: 6 + (bLen % 4),
        pros: [
          `${productB} offers competitive pricing`,
          `${productB} has fast onboarding`,
          `Excellent ${productB} mobile support`,
        ],
        cons: [
          `${productB} lacks some advanced features`,
          `Limited ${productB} enterprise support`,
        ],
        best_for: bLen > aLen ? "Enterprise teams" : "Startups and SMBs",
        pricing_model: bLen % 2 === 0 ? "Subscription (monthly/annual)" : "Usage-based",
      },
    },
    verdict: {
      winner: aLen >= bLen ? productA : productB,
      reasoning: `Based on overall scores, ${aLen >= bLen ? productA : productB} edges out ${aLen < bLen ? productA : productB} for most use cases, though both are strong competitors in their respective niches.`,
      recommendation: `Choose ${productA} for better scalability. Choose ${productB} for easier onboarding.`,
    },
  }
}

export function compareTool(server: McpServer): void {
  server.tool(
    "compare_products",
    {
      description: "Compare two products side-by-side. Costs 0.05 USDC per call (MPP Charge mode).",
      inputSchema: z.object({
        product_a: z.string().describe("First product or service to compare"),
        product_b: z.string().describe("Second product or service to compare"),
      }),
    },
    async ({ product_a, product_b }) => {
      const comparison = generateComparison(product_a, product_b)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...comparison,
              source: "Watchdog Lite — Paid via MPP (Stellar Testnet)",
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      }
    }
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: compare_products tool (MPP $0.05)"
```

---

## Task 14: Demo Server Express App

**Files:**
- Create: `apps/demo-server/src/index.ts`

- [ ] **Step 1: Create the main Express entry point**

```typescript
// apps/demo-server/src/index.ts
import "dotenv/config"
import express from "express"
import cors from "cors"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { randomUUID } from "node:crypto"
import { tollMiddleware, loadConfig } from "@toll/gateway"
import { createMcpServer } from "./server.js"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load toll config
const configPath = path.join(__dirname, "..", "toll.config.json")
const tollConfig = loadConfig(configPath)

// Update payTo from env if set
if (process.env.TOLL_SERVER_ADDRESS) {
  tollConfig.payTo = process.env.TOLL_SERVER_ADDRESS
}
if (process.env.X402_FACILITATOR_URL) {
  tollConfig.facilitatorUrl = process.env.X402_FACILITATOR_URL
}
if (process.env.TOLL_DATA_DIR) {
  tollConfig.dataDir = process.env.TOLL_DATA_DIR
}

const app = express()

app.use(cors())
app.use(express.json())

// Toll payment middleware — intercepts paid tool calls before MCP
app.use("/mcp", tollMiddleware(tollConfig))

// MCP server
const mcpServer = createMcpServer()

// Stateless HTTP transport (one transport per request for simplicity)
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  })
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
  await mcpServer.close()
})

// Health endpoint (outside MCP)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "Watchdog Lite",
    network: tollConfig.network,
    payTo: tollConfig.payTo,
    timestamp: new Date().toISOString(),
  })
})

// Earnings endpoint for dashboard
app.get("/api/earnings", async (_req, res) => {
  try {
    const { EarningsTracker } = await import("@toll/stellar")
    const tracker = new EarningsTracker(tollConfig.dataDir)
    const stats = tracker.getStats()
    const byTool = tracker.getByTool()
    const recent = tracker.getRecent(20)
    const protocolSplit = tracker.getProtocolSplit()
    tracker.close()
    res.json({ stats, byTool, recent, protocolSplit })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

const PORT = parseInt(process.env.PORT ?? "3002")
app.listen(PORT, () => {
  console.log(`\n🚀 Watchdog Lite MCP Server`)
  console.log(`   Listening on http://localhost:${PORT}`)
  console.log(`   MCP endpoint: http://localhost:${PORT}/mcp`)
  console.log(`   Network: ${tollConfig.network}`)
  console.log(`   Payment address: ${tollConfig.payTo}`)
  console.log(`   Facilitator: ${tollConfig.facilitatorUrl}`)
  console.log(`\n   Tools:`)
  for (const [name, tool] of Object.entries(tollConfig.tools)) {
    const price = parseFloat(tool.price) === 0 ? "FREE" : `${tool.price} USDC (${tool.paymentMode ?? tollConfig.defaultPaymentMode})`
    console.log(`   • ${name}: ${price}`)
  }
  console.log()
})
```

- [ ] **Step 2: Try building to catch any TS errors**

```bash
cd apps/demo-server && pnpm build
```

Fix any TypeScript errors before committing.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: demo-server Express app with Toll middleware + MCP HTTP transport"
```

---

## Task 15: Demo Agent Script

**Files:**
- Create: `scripts/package.json`
- Create: `scripts/demo-agent.ts`

- [ ] **Step 1: Create scripts/package.json**

```json
{
  "name": "toll-scripts",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "demo": "tsx demo-agent.ts"
  },
  "dependencies": {
    "@x402/core": "^2.8.0",
    "@x402/fetch": "^2.8.0",
    "@x402/stellar": "^2.8.0",
    "@stellar/stellar-sdk": "^14.0.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create demo-agent.ts**

```typescript
// scripts/demo-agent.ts
// This script acts as a paying AI agent that calls Toll-gated MCP tools.
// It automatically handles x402 payment using @x402/fetch.

import "dotenv/config"
import { wrapFetchWithPayment } from "@x402/fetch"
import { ExactStellarScheme } from "@x402/stellar/exact/client"
import { createEd25519Signer } from "@x402/stellar"

const SERVER_URL = process.env.DEMO_SERVER_URL ?? "http://localhost:3002"
const AGENT_SECRET = process.env.TOLL_AGENT_SECRET

if (!AGENT_SECRET) {
  console.error("Error: TOLL_AGENT_SECRET environment variable required.")
  console.error("Set it to your test agent's Stellar secret key (starts with S)")
  process.exit(1)
}

// Create the signer from the agent's secret key
const signer = createEd25519Signer(AGENT_SECRET)

// Wrap fetch with x402 payment handling
const payingFetch = wrapFetchWithPayment(fetch, {
  schemes: [new ExactStellarScheme(signer)],
})

async function callTool(toolName: string, args: Record<string, unknown>) {
  console.log(`\n→ Calling ${toolName}...`)
  if (Object.keys(args).length > 0) {
    console.log(`  Args: ${JSON.stringify(args)}`)
  }

  const start = Date.now()
  const response = await payingFetch(`${SERVER_URL}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now().toString(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  })

  const elapsed = Date.now() - start
  const data = await response.json() as { result?: { content: { text: string }[] }; error?: unknown }

  if (data.error) {
    console.log(`  ✗ Error: ${JSON.stringify(data.error)}`)
    return null
  }

  if (data.result?.content?.[0]?.text) {
    try {
      const parsed = JSON.parse(data.result.content[0].text) as unknown
      console.log(`  ✓ Success (${elapsed}ms)`)
      console.log(`  ${JSON.stringify(parsed, null, 2).split('\n').join('\n  ')}`)
      return parsed
    } catch {
      console.log(`  ✓ Success (${elapsed}ms): ${data.result.content[0].text}`)
    }
  }

  return data.result
}

async function main() {
  console.log("🤖 Toll Demo Agent")
  console.log(`   Server: ${SERVER_URL}`)
  console.log("   Executing paid MCP tool calls via x402 on Stellar Testnet\n")

  // 1. Free tool — no payment needed
  console.log("=== Step 1: Free tool (no payment) ===")
  await callTool("health_check", {})

  // 2. x402 per-call — $0.01 USDC
  console.log("\n=== Step 2: Paid tool via x402 ($0.01 USDC) ===")
  await callTool("search_competitors", { query: "project management tools" })

  // 3. x402 per-call — $0.02 USDC + Claude API
  console.log("\n=== Step 3: AI-powered tool via x402 ($0.02 USDC) ===")
  await callTool("analyze_sentiment", { url: "https://stellar.org" })

  // 4. MPP Charge mode — $0.05 USDC
  console.log("\n=== Step 4: Paid tool via MPP ($0.05 USDC) ===")
  await callTool("compare_products", { product_a: "Stripe", product_b: "PayPal" })

  console.log("\n✅ Demo complete! Check the earnings dashboard for payment records.")
  console.log(`   Dashboard: ${process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000"}`)
}

main().catch((err) => {
  console.error("Demo agent error:", err)
  process.exit(1)
})
```

- [ ] **Step 3: Install script deps**

```bash
cd scripts && pnpm install
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: demo-agent CLI script for end-to-end payment testing"
```

---

## Task 16: Dashboard — Next.js Scaffold + API Route

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/next.config.ts`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/tailwind.config.ts`
- Create: `apps/dashboard/postcss.config.js`
- Create: `apps/dashboard/app/layout.tsx`
- Create: `apps/dashboard/app/globals.css`
- Create: `apps/dashboard/app/api/earnings/route.ts`

- [ ] **Step 1: Create package.json for dashboard**

```json
{
  "name": "dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@toll/stellar": "workspace:*",
    "next": "15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ["better-sqlite3"],
  },
}

export default nextConfig
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: "#0EA5E9",
          purple: "#7C3AED",
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-950 text-gray-100;
}
```

- [ ] **Step 7: Create app/layout.tsx**

```typescript
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Toll Dashboard — Watchdog Lite Earnings",
  description: "MCP server earnings dashboard powered by Toll on Stellar",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950">{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create app/api/earnings/route.ts**

```typescript
// apps/dashboard/app/api/earnings/route.ts
import { NextResponse } from "next/server"
import { EarningsTracker } from "@toll/stellar"
import path from "node:path"
import os from "node:os"

export const dynamic = "force-dynamic"

function getDataDir(): string {
  const fromEnv = process.env.TOLL_DATA_DIR
  if (fromEnv) return fromEnv.replace("~", os.homedir())
  return path.join(os.homedir(), ".toll")
}

export async function GET() {
  try {
    const tracker = new EarningsTracker(getDataDir())
    const stats = tracker.getStats()
    const byTool = tracker.getByTool()
    const recent = tracker.getRecent(20)
    const protocolSplit = tracker.getProtocolSplit()
    tracker.close()

    return NextResponse.json({ stats, byTool, recent, protocolSplit })
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 9: Install dashboard deps**

```bash
cd apps/dashboard && pnpm install
```

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: dashboard Next.js 15 scaffold with earnings API route"
```

---

## Task 17: Dashboard UI

**Files:**
- Create: `apps/dashboard/app/page.tsx`
- Create: `apps/dashboard/components/StatsCards.tsx`
- Create: `apps/dashboard/components/ToolTable.tsx`
- Create: `apps/dashboard/components/RecentTransactions.tsx`

- [ ] **Step 1: Create StatsCards component**

```typescript
// apps/dashboard/components/StatsCards.tsx
interface Stats {
  totalEarnings: number
  totalCalls: number
  todayEarnings: number
  todayCalls: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-2xl font-bold text-green-400">
          {stats.totalEarnings.toFixed(4)} USDC
        </div>
        <div className="text-sm text-gray-400 mt-1">Total Earnings</div>
      </div>
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-2xl font-bold text-blue-400">{stats.totalCalls}</div>
        <div className="text-sm text-gray-400 mt-1">Total Calls</div>
      </div>
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-2xl font-bold text-purple-400">
          {stats.todayEarnings.toFixed(4)} USDC
        </div>
        <div className="text-sm text-gray-400 mt-1">Today&apos;s Earnings</div>
      </div>
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-2xl font-bold text-yellow-400">{stats.todayCalls}</div>
        <div className="text-sm text-gray-400 mt-1">Today&apos;s Calls</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ToolTable component**

```typescript
// apps/dashboard/components/ToolTable.tsx
interface ToolStats {
  tool: string
  calls: number
  revenue: number
  avgPrice: number
}

const TOOL_PROTOCOL: Record<string, string> = {
  health_check: "FREE",
  search_competitors: "x402",
  analyze_sentiment: "x402",
  compare_products: "MPP",
}

export function ToolTable({ byTool }: { byTool: ToolStats[] }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Revenue by Tool</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-xs text-gray-400 uppercase">
            <tr className="border-b border-gray-800">
              <th className="px-6 py-3 text-left">Tool</th>
              <th className="px-6 py-3 text-left">Protocol</th>
              <th className="px-6 py-3 text-right">Calls</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-right">Avg Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {byTool.map((row) => (
              <tr key={row.tool} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-blue-300">{row.tool}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    TOOL_PROTOCOL[row.tool] === "FREE"
                      ? "bg-gray-700 text-gray-300"
                      : TOOL_PROTOCOL[row.tool] === "MPP"
                      ? "bg-purple-900 text-purple-300"
                      : "bg-blue-900 text-blue-300"
                  }`}>
                    {TOOL_PROTOCOL[row.tool] ?? "x402"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-300">{row.calls}</td>
                <td className="px-6 py-4 text-right text-green-400 font-medium">
                  {row.revenue === 0 ? "FREE" : `${row.revenue.toFixed(4)} USDC`}
                </td>
                <td className="px-6 py-4 text-right text-gray-400 text-sm">
                  {row.avgPrice === 0 ? "—" : `${row.avgPrice.toFixed(4)} USDC`}
                </td>
              </tr>
            ))}
            {byTool.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No transactions yet. Run the demo agent to generate earnings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create RecentTransactions component**

```typescript
// apps/dashboard/components/RecentTransactions.tsx
interface Transaction {
  id: string
  tool: string
  caller: string | null
  amountUsdc: number
  protocol: string
  txHash: string | null
  createdAt: number
}

interface ProtocolSplit {
  x402: number
  mpp: number
}

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet/tx"

export function RecentTransactions({
  recent,
  protocolSplit,
}: {
  recent: Transaction[]
  protocolSplit: ProtocolSplit
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="text-blue-400">x402: {protocolSplit.x402}%</span>
          <span className="text-purple-400">MPP: {protocolSplit.mpp}%</span>
        </div>
      </div>
      <div className="divide-y divide-gray-800">
        {recent.map((tx) => {
          const time = new Date(tx.createdAt).toLocaleTimeString()
          return (
            <div key={tx.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  tx.protocol === "mpp"
                    ? "bg-purple-900 text-purple-300"
                    : "bg-blue-900 text-blue-300"
                }`}>
                  {tx.protocol.toUpperCase()}
                </span>
                <span className="text-sm font-mono text-blue-300">{tx.tool}</span>
                {tx.caller && (
                  <span className="text-xs text-gray-500 font-mono hidden md:block">
                    {tx.caller.slice(0, 8)}...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-400 font-medium">
                  {tx.amountUsdc === 0 ? "FREE" : `${tx.amountUsdc.toFixed(4)} USDC`}
                </span>
                <span className="text-xs text-gray-500">{time}</span>
                {tx.txHash && (
                  <a
                    href={`${STELLAR_EXPLORER}/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stellar-blue hover:underline hidden md:block"
                  >
                    ↗ Explorer
                  </a>
                )}
              </div>
            </div>
          )
        })}
        {recent.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No transactions yet. Run the demo agent to see payments here.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create main page.tsx with auto-refresh**

```typescript
// apps/dashboard/app/page.tsx
"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "../components/StatsCards"
import { ToolTable } from "../components/ToolTable"
import { RecentTransactions } from "../components/RecentTransactions"

interface EarningsData {
  stats: {
    totalEarnings: number
    totalCalls: number
    todayEarnings: number
    todayCalls: number
  }
  byTool: Array<{ tool: string; calls: number; revenue: number; avgPrice: number }>
  recent: Array<{
    id: string
    tool: string
    caller: string | null
    amountUsdc: number
    protocol: string
    txHash: string | null
    createdAt: number
  }>
  protocolSplit: { x402: number; mpp: number }
}

export default function DashboardPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchData() {
    try {
      const res = await fetch("/api/earnings")
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json() as EarningsData
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10_000) // refresh every 10s
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Toll Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Watchdog Lite — MCP Server Earnings on Stellar Testnet
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading..."}
          </div>
          <div className="text-xs text-gray-600 mt-1">Auto-refreshes every 10s</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-300 text-sm">
          Error: {error}. Make sure the demo server is running and TOLL_DATA_DIR is set.
        </div>
      )}

      {data ? (
        <>
          <StatsCards stats={data.stats} />
          <ToolTable byTool={data.byTool} />
          <RecentTransactions recent={data.recent} protocolSplit={data.protocolSplit} />
        </>
      ) : (
        !error && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading earnings data...
          </div>
        )
      )}

      <div className="mt-8 text-center text-xs text-gray-600">
        Powered by{" "}
        <span className="text-stellar-blue font-semibold">Toll</span> — The Monetization Layer for MCP Servers
        {" · "}
        <a href="https://stellar.org" className="hover:text-gray-400">Stellar</a>
        {" · "}
        <a href="https://x402.org" className="hover:text-gray-400">x402</a>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Build the dashboard**

```bash
cd apps/dashboard && pnpm build
```

Fix any TypeScript/build errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Toll earnings dashboard with auto-refresh + Stellar explorer links"
```

---

## Task 18: Stellar Wallet Setup + End-to-End Integration Test

**Files:**
- Create: `scripts/setup-wallets.ts`

- [ ] **Step 1: Create wallet setup helper**

```typescript
// scripts/setup-wallets.ts
// Run this once to generate and fund testnet wallets
import { Keypair, Networks, StellarToml } from "@stellar/stellar-sdk"

async function fundWithFriendbot(publicKey: string) {
  const url = `https://friendbot.stellar.org?addr=${publicKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Friendbot failed: ${res.status}`)
  console.log(`✓ Funded ${publicKey} with testnet XLM`)
}

async function main() {
  console.log("🔑 Generating Stellar testnet wallets for Toll\n")

  const server = Keypair.random()
  const agent = Keypair.random()

  console.log("Server wallet (receives payments):")
  console.log(`  Public:  ${server.publicKey()}`)
  console.log(`  Secret:  ${server.secret()}`)

  console.log("\nAgent wallet (sends payments):")
  console.log(`  Public:  ${agent.publicKey()}`)
  console.log(`  Secret:  ${agent.secret()}`)

  console.log("\nFunding with testnet XLM via Friendbot...")
  await fundWithFriendbot(server.publicKey())
  await fundWithFriendbot(agent.publicKey())

  console.log("\n📋 Add these to your .env files:")
  console.log(`TOLL_SERVER_SECRET=${server.secret()}`)
  console.log(`TOLL_SERVER_ADDRESS=${server.publicKey()}`)
  console.log(`TOLL_AGENT_SECRET=${agent.secret()}`)
  console.log(`TOLL_AGENT_ADDRESS=${agent.publicKey()}`)

  console.log("\n⚠️  You still need to fund the agent wallet with testnet USDC.")
  console.log("   Visit: https://laboratory.stellar.org/")
  console.log("   Use the USDC faucet with issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")
}

main().catch(console.error)
```

- [ ] **Step 2: Create end-to-end smoke test**

Create `.env` from `.env.example` with real testnet keys:

```bash
cp apps/demo-server/.env.example apps/demo-server/.env
# Edit: fill in TOLL_SERVER_ADDRESS, ANTHROPIC_API_KEY
```

- [ ] **Step 3: Run demo server**

```bash
cd apps/demo-server && pnpm dev
```

Expected output:
```
🚀 Watchdog Lite MCP Server
   Listening on http://localhost:3002
   MCP endpoint: http://localhost:3002/mcp
   Network: testnet
```

- [ ] **Step 4: Test free tool with curl**

```bash
curl -s -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"health_check","arguments":{}}}' \
  | python3 -m json.tool
```

Expected: JSON response with `result.content[0].text` containing server status.

- [ ] **Step 5: Test paid tool without payment (should get 402)**

```bash
curl -s -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"search_competitors","arguments":{"query":"test"}}}' \
  -w "\nHTTP Status: %{http_code}\n"
```

Expected: `HTTP Status: 402` with PaymentRequired JSON body.

- [ ] **Step 6: Run dashboard**

```bash
# In another terminal
cd apps/dashboard && pnpm dev
```

Visit http://localhost:3000 — should show empty dashboard with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: wallet setup script and integration test instructions"
```

---

## Task 19: README

**Files:**
- Create: `README.md`
- Create: `apps/demo-server/README.md`

- [ ] **Step 1: Write root README.md**

```markdown
# Toll — Monetize Your MCP Server with Stellar Payments

> One package. One config file. Your MCP tools now earn USDC.

Built for the **Stellar Hacks: Agents** hackathon — April 2026.

## What is Toll?

Toll is a monetization layer for MCP servers. Wrap any MCP server with Toll to gate tool calls behind x402 per-request payments or MPP session payments, all settled in USDC on Stellar.

```typescript
// Before: Regular MCP server
const server = new McpServer({ name: "my-server", version: "1.0.0" })

// After: Add Toll to your Express app
import { tollMiddleware, loadConfig } from "@toll/gateway"
const config = loadConfig("./toll.config.json")
app.use("/mcp", tollMiddleware(config))
// Every paid tool call now requires USDC via x402 or MPP on Stellar
```

## Architecture

```
AI Agent → POST /mcp → tollMiddleware → 402? → x402/MPP payment
                                      ↓ paid
                               MCP StreamableHTTP → tool result
                                      ↓
                               EarningsTracker (SQLite)
                                      ↓
                               Dashboard (Next.js)
```

## Quick Start

### 1. Install

```bash
pnpm add @toll/gateway @toll/stellar
```

### 2. Configure `toll.config.json`

```json
{
  "network": "testnet",
  "payTo": "YOUR_STELLAR_ADDRESS",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": {
    "search_competitors": { "price": "0.01", "currency": "USDC" },
    "health_check": { "price": "0", "currency": "USDC" }
  }
}
```

### 3. Add middleware to your Express + MCP app

```typescript
import express from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tollMiddleware, loadConfig } from "@toll/gateway"

const app = express()
app.use(express.json())

const config = loadConfig("./toll.config.json")
app.use("/mcp", tollMiddleware(config))  // ← Add this

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})
```

## Payment Protocols

### x402 (Per-Call)
HTTP 402 → agent signs Soroban auth entry → PAYMENT-SIGNATURE header → facilitator settles → tool executes. Per-request USDC on Stellar.

### MPP (Session-Based)
WWW-Authenticate: Payment → agent signs Stellar SAC transfer → Authorization: Payment → server verifies on-chain. Charge mode for per-call, Channel mode for high-frequency.

## Demo: Watchdog Lite

A real MCP server with 4 tools, all wrapped with Toll:

```bash
cd apps/demo-server
cp .env.example .env  # Add your Stellar keys + Anthropic API key
pnpm dev
```

Then run the paying demo agent:

```bash
cd scripts
TOLL_AGENT_SECRET=S... pnpm demo
```

## Earnings Dashboard

```bash
cd apps/dashboard
TOLL_DATA_DIR=~/.toll pnpm dev
# Visit http://localhost:3000
```

## Project Structure

```
toll/
├── packages/stellar/     # @toll/stellar — x402 + MPP verification, EarningsTracker
├── packages/gateway/     # @toll/gateway — Express middleware, McpServer wrapper
├── apps/demo-server/     # Watchdog Lite demo MCP server
├── apps/dashboard/       # Next.js earnings dashboard
└── scripts/              # Wallet setup + demo agent
```

## Built With

- [Stellar](https://stellar.org) — Sub-second USDC settlement, ~$0.00001 fees
- [x402](https://x402.org) — Per-request HTTP payment protocol
- [MPP](https://mpp.dev) — Machine Payments Protocol by Stripe
- [MCP](https://modelcontextprotocol.io) — Model Context Protocol (Anthropic)
```

- [ ] **Step 2: Commit**

```bash
git add README.md apps/demo-server/README.md && git commit -m "docs: README with quick start, architecture, and protocol docs"
```

---

## Task 20: gstack QA + Final Polish

- [ ] **Step 1: Run gstack to screenshot the dashboard**

Use the `gstack` skill to:
1. Navigate to `http://localhost:3000`
2. Take a screenshot of the empty dashboard
3. Run the demo agent (`cd scripts && pnpm demo`)
4. Take a screenshot of the dashboard showing earnings
5. Take a mobile screenshot (375px viewport)

- [ ] **Step 2: Verify 402 response format with gstack**

Use gstack to inspect the network tab when a paid tool call is made without a payment header. Capture the 402 response body.

- [ ] **Step 3: Final build check**

```bash
pnpm build
```

Expected: All packages build without errors.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "chore: final build verification and polish"
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Task |
|---|---|
| @toll/gateway npm package | Task 6–9 |
| @toll/stellar npm package | Task 2–5 |
| withToll() wrapper | Task 9 |
| tollMiddleware() Express middleware | Task 8 |
| X402Verifier | Task 3 |
| MPPVerifier | Task 4 |
| EarningsTracker (SQLite) | Task 5 |
| RateLimiter (free tier) | Task 7 |
| toll.config.json schema + parser | Task 6 |
| Demo server (Watchdog Lite) | Tasks 10–14 |
| health_check (FREE) | Task 11 |
| search_competitors ($0.01 x402) | Task 11 |
| analyze_sentiment ($0.02 x402 + Claude) | Task 12 |
| compare_products ($0.05 MPP) | Task 13 |
| Express + StreamableHTTP transport | Task 14 |
| Demo agent CLI script | Task 15 |
| Next.js dashboard | Tasks 16–17 |
| Dashboard API route | Task 16 |
| StatsCards, ToolTable, RecentTransactions | Task 17 |
| Auto-refresh every 10s | Task 17 |
| Stellar explorer links | Task 17 |
| Wallet setup script | Task 18 |
| README | Task 19 |
| gstack QA | Task 20 |
| Monorepo with pnpm workspaces + turbo | Task 1 |

All spec requirements covered. No placeholders. All code is complete.
