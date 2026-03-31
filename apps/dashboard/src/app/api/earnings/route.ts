import { NextResponse } from "next/server"
import { EarningsTracker } from "@toll/stellar"

// GET /api/earnings — returns all earnings data for the dashboard
export async function GET() {
  const dataDir = process.env.TOLL_DATA_DIR?.replace("~", process.env.HOME ?? "") ?? undefined

  const tracker = new EarningsTracker(dataDir)
  try {
    const stats = tracker.getStats()
    const byTool = tracker.getByTool()
    const recent = tracker.getRecent(20)
    const protocolSplit = tracker.getProtocolSplit()

    return NextResponse.json(
      { stats, byTool, recent, protocolSplit },
      { headers: { "Cache-Control": "no-store" } }
    )
  } finally {
    tracker.close()
  }
}
