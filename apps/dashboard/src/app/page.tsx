"use client"

import { useCallback, useEffect, useState } from "react"
import { StatCard } from "@/components/StatCard"
import { ToolTable } from "@/components/ToolTable"
import { RecentTransactions } from "@/components/RecentTransactions"
import { ProtocolSplitBar } from "@/components/ProtocolSplitBar"
import type { EarningsData } from "@/lib/types"

const REFRESH_INTERVAL_MS = 5000

function useDashboard() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const resp = await fetch("/api/earnings")
      if (resp.ok) {
        setData(await resp.json())
        setLastUpdated(new Date())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetch_])

  return { data, loading, lastUpdated, refresh: fetch_ }
}

export default function Dashboard() {
  const { data, loading, lastUpdated, refresh } = useDashboard()

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Toll Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            MCP Monetization Gateway · Stellar Testnet
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={refresh}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors border border-gray-700"
          >
            Refresh
          </button>
          {lastUpdated && (
            <p className="text-xs text-gray-600 mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-600 text-sm">
          Loading earnings data…
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center py-24 text-gray-600 text-sm">
          Could not load data. Is the demo server running?
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Earnings"
              value={`$${data.stats.totalEarnings.toFixed(4)}`}
              sub="USDC on Stellar"
              accent
            />
            <StatCard
              label="Total Calls"
              value={String(data.stats.totalCalls)}
              sub="paid tool calls"
            />
            <StatCard
              label="Today"
              value={`$${data.stats.todayEarnings.toFixed(4)}`}
              sub={`${data.stats.todayCalls} calls`}
            />
            <ProtocolSplitBar split={data.protocolSplit} />
          </div>

          {/* Tool table + Recent transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <ToolTable tools={data.byTool} />
            </div>
            <div className="lg:col-span-2">
              <RecentTransactions records={data.recent} />
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-700 mt-10">
            Auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s ·{" "}
            <a
              href="https://github.com/stellar"
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              Built on Stellar
            </a>
          </p>
        </>
      )}
    </main>
  )
}
