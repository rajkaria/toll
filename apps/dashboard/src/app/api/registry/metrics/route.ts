import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { computeQualityScore } from "@/lib/quality"

interface MetricsBody {
  metrics: Array<{
    serverUrl: string
    toolName: string
    totalCalls: number
    successCount: number
    latencyP50: number
    latencyP95: number
  }>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MetricsBody

    if (!body.metrics?.length) {
      return NextResponse.json({ error: "No metrics provided" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    let updated = 0

    for (const m of body.metrics) {
      // Look up server by URL
      const { data: server } = await supabase
        .from("servers")
        .select("id, last_heartbeat")
        .eq("url", m.serverUrl)
        .single()

      if (!server) continue

      // Look up tool
      const { data: tool } = await supabase
        .from("tools")
        .select("id, total_calls, success_rate")
        .eq("server_id", server.id)
        .eq("name", m.toolName)
        .single()

      if (!tool) continue

      // Compute running averages
      const oldTotal = Number(tool.total_calls) || 0
      const newTotal = oldTotal + m.totalCalls
      const oldSuccessRate = tool.success_rate ?? 1.0
      const newSuccessRate = newTotal > 0
        ? (oldSuccessRate * oldTotal + (m.successCount / m.totalCalls) * m.totalCalls) / newTotal
        : oldSuccessRate

      const qualityScore = computeQualityScore({
        lastHeartbeat: new Date(server.last_heartbeat),
        successRate: newSuccessRate,
        latencyP50: m.latencyP50,
        totalCalls: newTotal,
      })

      await supabase
        .from("tools")
        .update({
          total_calls: newTotal,
          success_rate: Math.round(newSuccessRate * 1000) / 1000,
          latency_p50_ms: m.latencyP50,
          latency_p95_ms: m.latencyP95,
          quality_score: Math.round(qualityScore * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tool.id)

      updated++
    }

    return NextResponse.json({ updated, total: body.metrics.length })
  } catch (err) {
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 })
  }
}
