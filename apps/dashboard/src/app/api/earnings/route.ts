import { NextResponse } from "next/server"
import { createRequire } from "node:module"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"

// Realistic demo/seed data shown when no real transactions exist yet.
// Gives hackathon judges a sense of the product without fake live data.
function getDemoData() {
  const now = Date.now()
  const hour = 3600000
  const day = 86400000

  // Stellar-format addresses (56 chars, starting with G)
  const callers = [
    "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
    "GDFX7RBCES3LUGBHRHKSO2WQXNIBPUDSERV3MHKCEOP5QFN2XDRXHZ",
    "GC3CLEUNQVCEBI764WSHIMAAIY3K4NWFMCATLPJV3OYIKJRFPBHNOL",
    "GDQRUDNV3D3DF3KMVPWHFW7Y676AEPL7U6CEXKCD2F7HLEPFF5HKOE",
    "GBZX4364MNZFALQFCOFHQO3CKXJPRIFWPJQCFQ5FOLMIHO7DCPHLAT",
  ]

  const truncAddr = (a: string) => `${a.slice(0, 5)}...${a.slice(-3)}`

  const txHash = (seed: number) => {
    const chars = "0123456789abcdef"
    let h = ""
    for (let i = 0; i < 64; i++) h += chars[(seed * (i + 7) * 31) % 16]
    return h
  }

  const recentTransactions = [
    { id: "tx-001", tool: "search_competitors",  caller: callers[0], amountUsdc: 0.0100, protocol: "x402", txHash: txHash(1),  createdAt: now - 0.4 * hour },
    { id: "tx-002", tool: "analyze_sentiment",   caller: callers[1], amountUsdc: 0.0200, protocol: "x402", txHash: txHash(2),  createdAt: now - 1.1 * hour },
    { id: "tx-003", tool: "compare_products",    caller: callers[2], amountUsdc: 0.0500, protocol: "x402", txHash: txHash(3),  createdAt: now - 1.8 * hour },
    { id: "tx-004", tool: "search_competitors",  caller: callers[0], amountUsdc: 0.0100, protocol: "x402", txHash: txHash(4),  createdAt: now - 2.5 * hour },
    { id: "tx-005", tool: "analyze_sentiment",   caller: callers[3], amountUsdc: 0.0200, protocol: "mpp",  txHash: txHash(5),  createdAt: now - 4.2 * hour },
    { id: "tx-006", tool: "compare_products",    caller: callers[1], amountUsdc: 0.0500, protocol: "x402", txHash: txHash(6),  createdAt: now - 6.0 * hour },
    { id: "tx-007", tool: "search_competitors",  caller: callers[4], amountUsdc: 0.0100, protocol: "x402", txHash: txHash(7),  createdAt: now - 8.3 * hour },
    { id: "tx-008", tool: "health_check",        caller: callers[2], amountUsdc: 0.0000, protocol: "x402", txHash: txHash(8),  createdAt: now - 10.1 * hour },
    { id: "tx-009", tool: "analyze_sentiment",   caller: callers[3], amountUsdc: 0.0200, protocol: "mpp",  txHash: txHash(9),  createdAt: now - 14.5 * hour },
    { id: "tx-010", tool: "search_competitors",  caller: callers[0], amountUsdc: 0.0100, protocol: "x402", txHash: txHash(10), createdAt: now - 18.7 * hour },
  ]

  // 7 days of earnings showing growth trend
  const earningsPerDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * day)
    const earnings = [0.1200, 0.1800, 0.2500, 0.3100, 0.3800, 0.4600, 0.7200][i]
    return { day: d.toISOString().slice(0, 10), earnings }
  })

  // 24 hours of call volume — higher during work hours (UTC)
  const callsPerHour = Array.from({ length: 24 }, (_, h) => {
    const calls = h >= 9 && h <= 17
      ? [5, 7, 6, 8, 9, 7, 8, 6, 5][h - 9]
      : h >= 6 && h <= 20
        ? [1, 2, 3][h % 3]
        : h === 0 ? 1 : 0
    return { hour: String(h).padStart(2, "0"), calls }
  })

  return {
    stats: {
      totalEarnings: 2.4700,
      totalCalls: 89,
      todayEarnings: 0.3400,
      todayCalls: 12,
    },
    byTool: [
      { tool: "compare_products",   calls: 12, revenue: 0.6000, avgPrice: 0.0500 },
      { tool: "analyze_sentiment",  calls: 28, revenue: 0.5600, avgPrice: 0.0200 },
      { tool: "search_competitors", calls: 45, revenue: 0.4500, avgPrice: 0.0100 },
      { tool: "health_check",       calls: 4,  revenue: 0.0000, avgPrice: 0.0000 },
    ],
    recent: recentTransactions.map((tx) => ({
      ...tx,
      caller: truncAddr(tx.caller),
    })),
    protocolSplit: { x402: 86, mpp: 14 },
    analytics: {
      earningsPerDay,
      callsPerHour,
      topCallers: [
        { caller: truncAddr(callers[0]), calls: 18, total: 0.5400 },
        { caller: truncAddr(callers[1]), calls: 14, total: 0.4200 },
        { caller: truncAddr(callers[3]), calls: 11, total: 0.3800 },
        { caller: truncAddr(callers[2]), calls: 9,  total: 0.3500 },
        { caller: truncAddr(callers[4]), calls: 7,  total: 0.2100 },
      ],
    },
    notice: "Demo data shown. Connect your server to see live earnings.",
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
  const data = liveData ?? getDemoData()

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
