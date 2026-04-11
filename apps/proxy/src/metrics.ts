interface ToolMetrics {
  serverUrl: string
  toolName: string
  totalCalls: number
  successCount: number
  latencies: number[]
}

export class MetricsCollector {
  private metrics = new Map<string, ToolMetrics>()
  private registryUrl: string
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor(registryUrl: string) {
    this.registryUrl = registryUrl
  }

  recordCall(serverUrl: string, toolName: string, latencyMs: number, success: boolean): void {
    const key = `${serverUrl}::${toolName}`
    let m = this.metrics.get(key)
    if (!m) {
      m = { serverUrl, toolName, totalCalls: 0, successCount: 0, latencies: [] }
      this.metrics.set(key, m)
    }
    m.totalCalls++
    if (success) m.successCount++
    m.latencies.push(latencyMs)
    // Keep only last 1000 latencies
    if (m.latencies.length > 1000) m.latencies = m.latencies.slice(-1000)
  }

  startPeriodicFlush(intervalMs = 60_000): void {
    this.flushInterval = setInterval(() => this.flush(), intervalMs)
  }

  stopPeriodicFlush(): void {
    if (this.flushInterval) clearInterval(this.flushInterval)
  }

  async flush(): Promise<void> {
    if (this.metrics.size === 0) return

    const payload = Array.from(this.metrics.values()).map((m) => ({
      serverUrl: m.serverUrl,
      toolName: m.toolName,
      totalCalls: m.totalCalls,
      successCount: m.successCount,
      latencyP50: percentile(m.latencies, 50),
      latencyP95: percentile(m.latencies, 95),
    }))

    // Reset after snapshot
    this.metrics.clear()

    try {
      await fetch(`${this.registryUrl}/api/registry/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: payload }),
      })
    } catch {
      // Silently fail — metrics are best-effort
    }
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}
