import { TollClient } from "./client.js"
import type { TollClientConfig, ToolCallResult, SpendingReport, ServerManifest } from "./types.js"

export interface AggregatorConfig {
  servers: Array<{ name: string; url: string }>
  secretKey?: string
  budget?: TollClientConfig["budget"]
}

interface ToolMapping {
  serverName: string
  client: TollClient
  toolInfo: ServerManifest["tools"][0]
}

/**
 * TollAggregator — wraps multiple TollClient instances for multi-server scenarios.
 * Discovers tools from all servers, routes calls to the right server,
 * and provides unified spending tracking.
 */
export class TollAggregator {
  private clients = new Map<string, TollClient>()
  private toolMap = new Map<string, ToolMapping>()
  private config: AggregatorConfig

  constructor(config: AggregatorConfig) {
    this.config = config
    for (const server of config.servers) {
      this.clients.set(server.name, new TollClient({
        serverUrl: server.url,
        secretKey: config.secretKey,
        budget: config.budget,
      }))
    }
  }

  /** Discover all tools from all servers */
  async discoverAll(): Promise<Map<string, ToolMapping>> {
    this.toolMap.clear()

    for (const [name, client] of this.clients) {
      try {
        const manifest = await client.discoverTools()
        for (const tool of manifest.tools) {
          const key = this.toolMap.has(tool.name) ? `${name}:${tool.name}` : tool.name
          this.toolMap.set(key, { serverName: name, client, toolInfo: tool })
        }
      } catch {
        // Server unreachable, skip
      }
    }

    return this.toolMap
  }

  /** Call a tool (auto-routes to correct server) */
  async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
    const mapping = this.toolMap.get(toolName)
    if (!mapping) {
      return { success: false, paid: false, error: `Tool '${toolName}' not found. Run discoverAll() first.` }
    }
    return mapping.client.callTool(toolName, args)
  }

  /** Get unified spending across all servers */
  getSpending(): Record<string, SpendingReport> {
    const result: Record<string, SpendingReport> = {}
    for (const [name, client] of this.clients) {
      result[name] = client.getSpending()
    }
    return result
  }

  /** List all discovered tools */
  listTools(): Array<{ name: string; server: string; price: string; free: boolean }> {
    return [...this.toolMap.entries()].map(([name, mapping]) => ({
      name,
      server: mapping.serverName,
      price: mapping.toolInfo.price,
      free: mapping.toolInfo.free,
    }))
  }
}
