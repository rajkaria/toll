import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

// Use require() for better-sqlite3 — CJS native module that doesn't work
// with Next.js bundler ESM imports
const require = createRequire(import.meta.url)
const Database = require("better-sqlite3") as typeof import("better-sqlite3")

function getDb() {
  const envDir = process.env.TOLL_DATA_DIR?.replace("~", process.env.HOME ?? "")
  const dir = envDir || path.join(os.homedir(), ".toll")
  fs.mkdirSync(dir, { recursive: true })
  const dbPath = path.join(dir, "earnings.db")
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      tool TEXT NOT NULL,
      caller TEXT,
      amount_usdc REAL NOT NULL,
      protocol TEXT NOT NULL,
      tx_hash TEXT,
      created_at INTEGER NOT NULL
    );
  `)
  return db
}

export async function GET() {
  const db = getDb()
  try {
    const total = db.prepare(`SELECT COALESCE(SUM(amount_usdc),0) as earnings, COUNT(*) as calls FROM transactions`).get() as { earnings: number; calls: number }
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = db.prepare(`SELECT COALESCE(SUM(amount_usdc),0) as earnings, COUNT(*) as calls FROM transactions WHERE created_at >= ?`).get(todayStart.getTime()) as { earnings: number; calls: number }

    const byTool = db.prepare(`
      SELECT tool, COUNT(*) as calls, COALESCE(SUM(amount_usdc),0) as revenue, COALESCE(AVG(amount_usdc),0) as avgPrice
      FROM transactions GROUP BY tool ORDER BY revenue DESC
    `).all() as Array<{ tool: string; calls: number; revenue: number; avgPrice: number }>

    const recent = db.prepare(`
      SELECT id, tool, caller, amount_usdc as amountUsdc, protocol, tx_hash as txHash, created_at as createdAt
      FROM transactions ORDER BY created_at DESC LIMIT 20
    `).all()

    const protocolRows = db.prepare(`SELECT protocol, COUNT(*) as cnt FROM transactions GROUP BY protocol`).all() as Array<{ protocol: string; cnt: number }>
    const totalCount = protocolRows.reduce((s, r) => s + r.cnt, 0)
    const x402Row = protocolRows.find((r) => r.protocol === "x402")
    const mppRow = protocolRows.find((r) => r.protocol === "mpp")

    return NextResponse.json({
      stats: {
        totalEarnings: total.earnings,
        totalCalls: total.calls,
        todayEarnings: today.earnings,
        todayCalls: today.calls,
      },
      byTool,
      recent,
      protocolSplit: totalCount === 0
        ? { x402: 0, mpp: 0 }
        : {
            x402: Math.round(((x402Row?.cnt ?? 0) / totalCount) * 100),
            mpp: Math.round(((mppRow?.cnt ?? 0) / totalCount) * 100),
          },
    }, { headers: { "Cache-Control": "no-store" } })
  } finally {
    db.close()
  }
}
