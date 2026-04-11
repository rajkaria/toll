import type BetterSqlite3 from "better-sqlite3"
// better-sqlite3 is CJS — handle ESM/CJS/bundler interop robustly
import _DatabaseModule from "better-sqlite3"
import { createRequire } from "node:module"

type DatabaseType = BetterSqlite3.Database
let Database: typeof BetterSqlite3
if (typeof _DatabaseModule === "function") {
  Database = _DatabaseModule
} else if ((_DatabaseModule as unknown as { default?: typeof BetterSqlite3 }).default) {
  Database = (_DatabaseModule as unknown as { default: typeof BetterSqlite3 }).default
} else {
  // Last resort: use require() which always works for CJS packages
  const require = createRequire(import.meta.url)
  Database = require("better-sqlite3") as typeof BetterSqlite3
}
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
  private db: DatabaseType

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
    // Idempotency: if this tx_hash was already recorded, skip duplicate
    if (input.txHash) {
      const existing = this.db
        .prepare(`SELECT id FROM transactions WHERE tx_hash = ?`)
        .get(input.txHash) as { id: string } | undefined
      if (existing) return existing.id
    }

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

  getAnalytics(): {
    earningsPerDay: { day: string; earnings: number }[]
    callsPerHour: { hour: string; calls: number }[]
    topCallers: { caller: string; calls: number; total: number }[]
  } {
    const earningsPerDay = this.db
      .prepare(
        `SELECT date(created_at/1000, 'unixepoch') as day, COALESCE(SUM(amount_usdc),0) as earnings
         FROM transactions GROUP BY day ORDER BY day DESC LIMIT 7`
      )
      .all() as { day: string; earnings: number }[]

    const oneDayAgo = Date.now() - 86400000
    const callsPerHour = this.db
      .prepare(
        `SELECT strftime('%H', created_at/1000, 'unixepoch') as hour, COUNT(*) as calls
         FROM transactions WHERE created_at >= ? GROUP BY hour ORDER BY hour`
      )
      .all(oneDayAgo) as { hour: string; calls: number }[]

    const topCallers = this.db
      .prepare(
        `SELECT caller, COUNT(*) as calls, COALESCE(SUM(amount_usdc),0) as total
         FROM transactions WHERE caller IS NOT NULL GROUP BY caller ORDER BY total DESC LIMIT 5`
      )
      .all() as { caller: string; calls: number; total: number }[]

    return { earningsPerDay: earningsPerDay.reverse(), callsPerHour, topCallers }
  }

  /** Return the full earnings data structure expected by the dashboard */
  getFullEarningsData() {
    return {
      stats: this.getStats(),
      byTool: this.getByTool(),
      recent: this.getRecent(),
      protocolSplit: this.getProtocolSplit(),
      analytics: this.getAnalytics(),
    }
  }

  close() {
    this.db.close()
  }
}
