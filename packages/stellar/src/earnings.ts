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
