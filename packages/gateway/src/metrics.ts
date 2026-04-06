/**
 * Toll Prometheus Metrics — zero dependencies, hand-rolled text format.
 * Exposes /metrics endpoint with toll-specific counters and histograms.
 */

interface Counter {
  name: string
  help: string
  labels: Record<string, number>
}

interface Histogram {
  name: string
  help: string
  sum: number
  count: number
  buckets: Map<number, number>
}

const DURATION_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

export class TollMetrics {
  private counters = new Map<string, Counter>()
  private histograms = new Map<string, Histogram>()
  private gauges = new Map<string, number>()

  constructor() {
    this.initCounter("toll_requests_total", "Total MCP tool call requests")
    this.initCounter("toll_payments_total", "Total successful payments")
    this.initCounter("toll_payment_failures_total", "Total failed payments")
    this.initCounter("toll_replay_rejections_total", "Total replay attack rejections")
    this.initCounter("toll_policy_rejections_total", "Total spending policy rejections")
    this.initCounter("toll_rate_limit_hits_total", "Total rate limit hits")
    this.initCounter("toll_402_responses_total", "Total 402 responses sent")
    this.initHistogram("toll_request_duration_seconds", "Request duration in seconds")
    this.initHistogram("toll_payment_amount_usdc", "Payment amounts in USDC")
  }

  private initCounter(name: string, help: string): void {
    this.counters.set(name, { name, help, labels: {} })
  }

  private initHistogram(name: string, help: string): void {
    const buckets = new Map<number, number>()
    for (const b of DURATION_BUCKETS) buckets.set(b, 0)
    this.histograms.set(name, { name, help, sum: 0, count: 0, buckets })
  }

  increment(name: string, labels?: Record<string, string>): void {
    const c = this.counters.get(name)
    if (!c) return
    const key = labels ? Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",") : ""
    c.labels[key] = (c.labels[key] ?? 0) + 1
  }

  observe(name: string, value: number): void {
    const h = this.histograms.get(name)
    if (!h) return
    h.sum += value
    h.count++
    for (const [bucket] of h.buckets) {
      if (value <= bucket) h.buckets.set(bucket, (h.buckets.get(bucket) ?? 0) + 1)
    }
  }

  setGauge(name: string, value: number): void {
    this.gauges.set(name, value)
  }

  /** Render all metrics in Prometheus text exposition format */
  render(): string {
    const lines: string[] = []

    for (const c of this.counters.values()) {
      lines.push(`# HELP ${c.name} ${c.help}`)
      lines.push(`# TYPE ${c.name} counter`)
      if (Object.keys(c.labels).length === 0) {
        lines.push(`${c.name} 0`)
      }
      for (const [labels, value] of Object.entries(c.labels)) {
        const suffix = labels ? `{${labels}}` : ""
        lines.push(`${c.name}${suffix} ${value}`)
      }
    }

    for (const h of this.histograms.values()) {
      lines.push(`# HELP ${h.name} ${h.help}`)
      lines.push(`# TYPE ${h.name} histogram`)
      for (const [bucket, count] of h.buckets) {
        lines.push(`${h.name}_bucket{le="${bucket}"} ${count}`)
      }
      lines.push(`${h.name}_bucket{le="+Inf"} ${h.count}`)
      lines.push(`${h.name}_sum ${h.sum}`)
      lines.push(`${h.name}_count ${h.count}`)
    }

    for (const [name, value] of this.gauges) {
      lines.push(`# TYPE ${name} gauge`)
      lines.push(`${name} ${value}`)
    }

    return lines.join("\n") + "\n"
  }
}

export function createMetrics(): TollMetrics {
  return new TollMetrics()
}
