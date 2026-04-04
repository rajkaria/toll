import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

// Demo data shown on production when SQLite is unavailable
function getDemoData() {
  const now = Date.now()
  const day = (d: number) => {
    const dt = new Date(now - d * 86400000)
    return dt.toISOString().slice(0, 10)
  }

  return {
    stats: {
      totalEarnings: 2.47,
      totalCalls: 89,
      todayEarnings: 0.34,
      todayCalls: 12,
    },
    byTool: [
      { tool: "search_competitors", calls: 34, revenue: 0.34, avgPrice: 0.01 },
      { tool: "compare_products", calls: 18, revenue: 0.90, avgPrice: 0.05 },
      { tool: "analyze_sentiment", calls: 27, revenue: 0.54, avgPrice: 0.02 },
      { tool: "health_check", calls: 10, revenue: 0, avgPrice: 0 },
    ],
    recent: [
      { id: "tx-001", tool: "search_competitors", caller: "GDLMSEG7...Y2RD4", amountUsdc: 0.01, protocol: "x402", txHash: "a1b2c3d4e5f6", createdAt: now - 120000 },
      { id: "tx-002", tool: "analyze_sentiment", caller: "GAQUKLUY...34JAU", amountUsdc: 0.02, protocol: "x402", txHash: "f6e5d4c3b2a1", createdAt: now - 300000 },
      { id: "tx-003", tool: "compare_products", caller: "GDLMSEG7...Y2RD4", amountUsdc: 0.05, protocol: "mpp", txHash: null, createdAt: now - 600000 },
      { id: "tx-004", tool: "search_competitors", caller: "GAQUKLUY...34JAU", amountUsdc: 0.01, protocol: "x402", txHash: "c3d4e5f6a1b2", createdAt: now - 900000 },
      { id: "tx-005", tool: "analyze_sentiment", caller: "GDLMSEG7...Y2RD4", amountUsdc: 0.02, protocol: "x402", txHash: "b2a1f6e5d4c3", createdAt: now - 1500000 },
      { id: "tx-006", tool: "compare_products", caller: "GAQUKLUY...34JAU", amountUsdc: 0.05, protocol: "mpp", txHash: null, createdAt: now - 2100000 },
      { id: "tx-007", tool: "search_competitors", caller: "GBXY4RAT...Q7KLM", amountUsdc: 0.01, protocol: "x402", txHash: "d4c3b2a1f6e5", createdAt: now - 3600000 },
      { id: "tx-008", tool: "analyze_sentiment", caller: "GDLMSEG7...Y2RD4", amountUsdc: 0.02, protocol: "x402", txHash: "e5f6a1b2c3d4", createdAt: now - 7200000 },
    ],
    protocolSplit: { x402: 68, mpp: 32 },
    analytics: {
      earningsPerDay: [
        { day: day(6), earnings: 0.18 },
        { day: day(5), earnings: 0.31 },
        { day: day(4), earnings: 0.42 },
        { day: day(3), earnings: 0.29 },
        { day: day(2), earnings: 0.55 },
        { day: day(1), earnings: 0.38 },
        { day: day(0), earnings: 0.34 },
      ],
      callsPerHour: [
        { hour: "08", calls: 3 },
        { hour: "09", calls: 7 },
        { hour: "10", calls: 12 },
        { hour: "11", calls: 9 },
        { hour: "12", calls: 5 },
        { hour: "13", calls: 8 },
        { hour: "14", calls: 15 },
        { hour: "15", calls: 11 },
        { hour: "16", calls: 6 },
        { hour: "17", calls: 4 },
        { hour: "18", calls: 2 },
      ],
      topCallers: [
        { caller: "GDLMSEG75J42ONHK5JOKZ7LTR52O47EX", calls: 34, total: 0.98 },
        { caller: "GAQUKLUYJ7XEAM7GXZXPAFXBNNC2BXTH", calls: 28, total: 0.82 },
        { caller: "GBXY4RATCKP7JMQLE2VNSFG43NQHK7KL", calls: 17, total: 0.41 },
        { caller: "GC3DMFPW6YQLHG7KHZR5OPCXATSVQQ2R", calls: 10, total: 0.26 },
      ],
    },
    // Demo data served when SQLite unavailable (e.g. Vercel serverless)
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

export async function GET() {
  // Try live SQLite data first, fall back to demo data on Vercel/production
  const liveData = tryGetLiveData()
  const data = liveData ?? getDemoData()

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
