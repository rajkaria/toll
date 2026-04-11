/** Compute a 0-1 quality score for a tool */
export function computeQualityScore(params: {
  lastHeartbeat: Date
  successRate: number
  latencyP50: number
  totalCalls: number
}): number {
  const { lastHeartbeat, successRate, latencyP50, totalCalls } = params

  // Uptime: 1.0 if heartbeat within 1 hour, scales to 0 at 24 hours
  const hoursSinceHeartbeat = (Date.now() - lastHeartbeat.getTime()) / (1000 * 60 * 60)
  const uptime = Math.max(0, 1 - hoursSinceHeartbeat / 24)

  // Latency: 1.0 at 0ms, 0.0 at 5000ms+
  const normalizedLatency = Math.min(latencyP50 / 5000, 1.0)
  const latencyScore = 1 - normalizedLatency

  // Volume: log10 scale, 1M calls = 1.0, 1 call ≈ 0
  const volumeScore = totalCalls > 0 ? Math.min(Math.log10(totalCalls) / 6, 1.0) : 0

  return 0.3 * uptime + 0.3 * successRate + 0.2 * latencyScore + 0.2 * volumeScore
}
