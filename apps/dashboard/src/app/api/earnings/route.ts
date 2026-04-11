import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

// Empty state shown on production when SQLite is unavailable (e.g. Vercel serverless)
// The real earnings data lives in the demo server's SQLite DB
function getEmptyData() {
  return {
    stats: {
      totalEarnings: 0,
      totalCalls: 0,
      todayEarnings: 0,
      todayCalls: 0,
    },
    byTool: [],
    recent: [],
    protocolSplit: { x402: 0, mpp: 0 },
    analytics: {
      earningsPerDay: [],
      callsPerHour: [],
      topCallers: [],
    },
    notice: "Dashboard connects to the demo server's earnings database. Deploy with TOLL_DATA_DIR to see live data.",
  }
}

function tryGetLiveData() {
  try {
    const require2 = createRequire(import.meta.url)
    const Database = require2("better-sqlite3") as typeof import("better-sqlite3")

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

    const earningsPerDay = db.prepare(`
      SELECT date(created_at/1000, 'unixepoch') as day, COALESCE(SUM(amount_usdc),0) as earnings
      FROM transactions GROUP BY day ORDER BY day DESC LIMIT 7
    `).all() as Array<{ day: string; earnings: number }>

    const oneDayAgo = Date.now() - 86400000
    const callsPerHour = db.prepare(`
      SELECT strftime('%H', created_at/1000, 'unixepoch') as hour, COUNT(*) as calls
      FROM transactions WHERE created_at >= ? GROUP BY hour ORDER BY hour
    `).all(oneDayAgo) as Array<{ hour: string; calls: number }>

    const topCallers = db.prepare(`
      SELECT caller, COUNT(*) as calls, COALESCE(SUM(amount_usdc),0) as total
      FROM transactions WHERE caller IS NOT NULL GROUP BY caller ORDER BY total DESC LIMIT 5
    `).all() as Array<{ caller: string; calls: number; total: number }>

    db.close()

    return {
      stats: { totalEarnings: total.earnings, totalCalls: total.calls, todayEarnings: today.earnings, todayCalls: today.calls },
      byTool,
      recent,
      protocolSplit: totalCount === 0
        ? { x402: 0, mpp: 0 }
        : { x402: Math.round(((x402Row?.cnt ?? 0) / totalCount) * 100), mpp: Math.round(((mppRow?.cnt ?? 0) / totalCount) * 100) },
      analytics: { earningsPerDay: earningsPerDay.reverse(), callsPerHour, topCallers },
    }
  } catch {
    return null
  }
}

async function tryFetchRemote(): Promise<Record<string, unknown> | null> {
  const url = process.env.TOLL_EARNINGS_API_URL
  if (!url) return null

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      // Revalidate on every request — earnings change frequently
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET() {
  // Priority: remote API (Vercel → Railway) > local SQLite > empty state
  const remoteData = await tryFetchRemote()
  if (remoteData) {
    return NextResponse.json(remoteData, { headers: { "Cache-Control": "no-store" } })
  }

  const liveData = tryGetLiveData()
  const data = liveData ?? getEmptyData()

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
