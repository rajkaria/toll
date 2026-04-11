import type { TollConfig, EarningsTracker } from "@rajkaria123/toll-stellar"

export interface RegistryConfig {
  enabled?: boolean
  registryUrl?: string
  tags?: string[]
}

export interface ServerManifest {
  name: string
  version: string
  network: string
  publicKey: string
  protocols: string[]
  tools: Array<{
    name: string
    price: string
    currency: string
    paymentMode: string
    description: string | null
  }>
  tags: string[]
  stats: {
    totalCalls: number
    totalEarnings: number
    uptime: number
  }
  capabilities: string[]
}

const startTime = Date.now()

/** Generate server manifest for tool discovery */
export function generateManifest(config: TollConfig, earnings?: EarningsTracker): ServerManifest {
  const tools = Object.entries(config.tools).map(([name, cfg]) => ({
    name,
    price: cfg.price,
    currency: cfg.currency,
    paymentMode: cfg.paymentMode ?? config.defaultPaymentMode,
    description: cfg.description ?? null,
  }))

  let stats = { totalCalls: 0, totalEarnings: 0, uptime: 0 }
  if (earnings) {
    const s = earnings.getStats()
    stats = { totalCalls: s.totalCalls, totalEarnings: s.totalEarnings, uptime: Math.floor((Date.now() - startTime) / 1000) }
  }

  const capabilities: string[] = [
    "x402",
    "mpp",
    "spending_policy",
    "replay_protection",
    "rate_limiting",
    "api_key_auth",
    "sessions",
    "cost_estimation",
    "health_endpoints",
    "prometheus_metrics",
    "audit_log",
    "webhooks",
  ]

  return {
    name: "Toll MCP Server",
    version: "0.2.0",
    network: config.network,
    publicKey: config.payTo,
    protocols: ["x402", "mpp"],
    tools,
    tags: [],
    stats,
    capabilities,
  }
}
