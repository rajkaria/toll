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
