import type { TollClientConfig, ToolCallResult, ServerManifest, SpendingReport, TollEventHandler, TollEventType } from "./types.js"

/**
 * TollClient — Agent-side SDK for calling monetized MCP tools.
 *
 * Handles the full payment lifecycle: 402 detection, payment signing,
 * retry, budget tracking, and session management.
 *
 * Usage:
 *   const toll = new TollClient({ serverUrl: "http://localhost:3002", secretKey: "S..." })
 *   const result = await toll.callTool("search_competitors", { query: "CRM" })
 */
export class TollClient {
  private config: TollClientConfig
  private spending: { total: number; calls: number; byTool: Record<string, { spent: number; calls: number }> }
  private dailySpent: number = 0
  private dailyResetAt: number
  private handlers: TollEventHandler[] = []
  private x402Client: unknown = null

  constructor(config: TollClientConfig) {
    this.config = { autoRetry: true, ...config }
    this.spending = { total: 0, calls: 0, byTool: {} }
    this.dailyResetAt = this.todayEnd()
  }

  /** Call a monetized MCP tool */
  async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
    const mcpBody = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    })

    // First attempt — no payment
    const resp = await fetch(`${this.config.serverUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json, text/event-stream" },
      body: mcpBody,
    })

    if (resp.status === 200) {
      const data = await this.parseSseOrJson(resp)
      this.recordSpend(toolName, 0)
      this.emit("tool_called", { tool: toolName, paid: false })
      return { success: true, data, paid: false }
    }

    if (resp.status === 402) {
      const paymentRequired = await resp.json() as Record<string, unknown>
      const price = this.extractPrice(paymentRequired)

      // Budget check
      if (!this.checkBudget(price)) {
        return { success: false, paid: false, error: `Budget exceeded (price: $${price})` }
      }

      // Auto-retry with payment if configured and secret key available
      if (this.config.autoRetry && this.config.secretKey) {
        return this.payAndRetry(toolName, mcpBody, paymentRequired, price)
      }

      return {
        success: false,
        paid: false,
        amount: price.toString(),
        error: `Payment required: $${price} USDC`,
      }
    }

    return { success: false, paid: false, error: `Unexpected status ${resp.status}` }
  }

  /** Discover available tools on the server */
  async discoverTools(): Promise<ServerManifest> {
    const resp = await fetch(`${this.config.serverUrl}/health/tools`)
    if (!resp.ok) throw new Error(`Failed to discover tools: ${resp.status}`)
    return (await resp.json()) as ServerManifest
  }

  /** Get cost estimate for a set of tools */
  async estimateCost(tools: string[]): Promise<Record<string, unknown>> {
    const resp = await fetch(`${this.config.serverUrl}/cost`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tools }),
    })
    if (!resp.ok) throw new Error(`Failed to estimate cost: ${resp.status}`)
    return (await resp.json()) as Record<string, unknown>
  }

  /** Get spending report */
  getSpending(): SpendingReport {
    this.resetDailyIfNeeded()
    const maxDaily = this.config.budget?.maxDaily ? parseFloat(this.config.budget.maxDaily) : null
    return {
      totalSpent: this.spending.total,
      callCount: this.spending.calls,
      byTool: { ...this.spending.byTool },
      dailyBudget: maxDaily,
      dailyRemaining: maxDaily ? Math.max(0, maxDaily - this.dailySpent) : null,
    }
  }

  /** Register event handler */
  on(handler: TollEventHandler): void {
    this.handlers.push(handler)
  }

  // ── Private ──────────────────────────────────────────────

  private async payAndRetry(
    toolName: string,
    body: string,
    paymentRequired: Record<string, unknown>,
    price: number
  ): Promise<ToolCallResult> {
    try {
      // Initialize x402 client lazily
      if (!this.x402Client) {
        const { createEd25519Signer, USDC_TESTNET_ADDRESS } = await import("@x402/stellar")
        const { x402Client, x402HTTPClient } = await import("@x402/core/client")
        const { ExactStellarScheme } = await import("@x402/stellar")

        const signer = createEd25519Signer(this.config.secretKey!)
        const stellarScheme = new ExactStellarScheme(signer)
        // Detect network from 402 response (supports both testnet and mainnet)
        const network = (paymentRequired as { accepts?: Array<{ network?: string }> })?.accepts?.[0]?.network ?? "stellar:pubnet"
        const client = x402Client.fromConfig({
          schemes: [{
            network,
            client: stellarScheme,
          }],
        })
        this.x402Client = new x402HTTPClient(client)
      }

      const httpClient = this.x402Client as { createPaymentPayload: (pr: unknown) => Promise<unknown>; encodePaymentSignatureHeader: (pp: unknown) => Record<string, string>; getPaymentRequiredResponse: (fn: (n: string) => string | null | undefined, body?: unknown) => unknown }

      // Create payment payload
      const paymentPayload = await httpClient.createPaymentPayload(paymentRequired)
      const sigHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload)

      // Retry with payment
      const resp = await fetch(`${this.config.serverUrl}/mcp`, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json, text/event-stream", ...sigHeaders },
        body,
      })

      if (resp.status === 200) {
        const data = await this.parseSseOrJson(resp)
        this.recordSpend(toolName, price)
        this.emit("payment", { tool: toolName, amount: price, protocol: "x402" })
        return { success: true, data, paid: true, amount: price.toString(), protocol: "x402" }
      }

      return { success: false, paid: false, error: `Payment retry failed (${resp.status})` }
    } catch (err) {
      this.emit("error", { tool: toolName, error: String(err) })
      return { success: false, paid: false, error: `Payment error: ${err}` }
    }
  }

  private extractPrice(paymentRequired: Record<string, unknown>): number {
    // x402 format
    const accepts = paymentRequired.accepts as Array<{ amount?: string }> | undefined
    if (accepts?.[0]?.amount) {
      return parseInt(accepts[0].amount, 10) / 1e7 // base units to USDC
    }
    // MPP format
    if (paymentRequired.price) return parseFloat(paymentRequired.price as string)
    return 0
  }

  private checkBudget(price: number): boolean {
    this.resetDailyIfNeeded()
    if (this.config.budget?.maxPerCall && price > parseFloat(this.config.budget.maxPerCall)) {
      this.emit("budget_warning", { reason: "maxPerCall exceeded", price })
      return false
    }
    if (this.config.budget?.maxDaily && this.dailySpent + price > parseFloat(this.config.budget.maxDaily)) {
      this.emit("budget_warning", { reason: "maxDaily exceeded", spent: this.dailySpent, price })
      return false
    }
    return true
  }

  private recordSpend(tool: string, amount: number): void {
    this.spending.total += amount
    this.spending.calls++
    this.dailySpent += amount
    if (!this.spending.byTool[tool]) this.spending.byTool[tool] = { spent: 0, calls: 0 }
    this.spending.byTool[tool].spent += amount
    this.spending.byTool[tool].calls++
  }

  private resetDailyIfNeeded(): void {
    if (Date.now() > this.dailyResetAt) {
      this.dailySpent = 0
      this.dailyResetAt = this.todayEnd()
    }
  }

  private todayEnd(): number {
    const d = new Date()
    d.setHours(23, 59, 59, 999)
    return d.getTime()
  }

  private emit(event: TollEventType, data: Record<string, unknown>): void {
    for (const h of this.handlers) h(event, data)
  }

  private async parseSseOrJson(resp: Response): Promise<unknown> {
    const text = await resp.text()
    for (const line of text.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.startsWith("data:")) {
        try { return JSON.parse(trimmed.slice(5).trim()) } catch { /* continue */ }
      }
    }
    try { return JSON.parse(text) } catch { return text }
  }
}
