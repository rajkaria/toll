import type { Request, Response, RequestHandler } from "express"
import { signAndPay, extractPrice } from "@rajkaria123/toll-sdk"
import { ProxyBudgetTracker } from "./budget.js"
import { MetricsCollector } from "./metrics.js"

interface ProxyHandlerConfig {
  secretKey: string
  defaultTarget?: string
  budget: ProxyBudgetTracker
  metrics: MetricsCollector
}

export function createProxyHandler(config: ProxyHandlerConfig): RequestHandler {
  return async (req: Request, res: Response): Promise<void> => {
    // Determine target server from query param or default
    const target = (req.query.target as string) ?? config.defaultTarget
    if (!target) {
      res.status(400).json({
        error: "No target server specified",
        detail: "Pass ?target=https://server.com/mcp or set --target when starting the proxy",
      })
      return
    }

    const targetUrl = target.endsWith("/mcp") ? target : `${target}/mcp`
    const body = JSON.stringify(req.body)
    const startTime = Date.now()

    // Extract tool name for metrics (if it's a tool call)
    const toolName = req.body?.method === "tools/call" ? req.body?.params?.name : null

    try {
      // Forward request to target
      const resp = await fetch(targetUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json, text/event-stream" },
        body,
      })

      // Pass through non-402 responses
      if (resp.status !== 402) {
        const latency = Date.now() - startTime
        if (toolName) config.metrics.recordCall(target, toolName, latency, resp.status === 200)

        const contentType = resp.headers.get("content-type") ?? "application/json"
        const responseBody = await resp.text()
        res.status(resp.status).set("content-type", contentType).send(responseBody)
        return
      }

      // Handle 402: auto-pay
      const paymentRequired = (await resp.json()) as Record<string, unknown>
      const price = extractPrice(paymentRequired)

      // Check budget
      const budgetCheck = config.budget.check(price)
      if (!budgetCheck.allowed) {
        res.status(402).json({
          error: "Proxy budget limit reached",
          reason: budgetCheck.reason,
          originalPayment: paymentRequired,
        })
        return
      }

      // Sign and retry
      const result = await signAndPay(config.secretKey, targetUrl, body, paymentRequired)

      const latency = Date.now() - startTime

      if (result.success && result.response) {
        config.budget.record(price)
        if (toolName) config.metrics.recordCall(target, toolName, latency, true)

        const contentType = result.response.headers.get("content-type") ?? "application/json"
        const responseBody = await result.response.text()
        res.status(200).set("content-type", contentType).send(responseBody)
        return
      }

      if (toolName) config.metrics.recordCall(target, toolName, latency, false)
      res.status(result.status ?? 402).json({
        error: result.error ?? "Payment failed",
        detail: "The proxy attempted to pay but the payment was not accepted by the target server.",
      })
    } catch (err) {
      const latency = Date.now() - startTime
      if (toolName) config.metrics.recordCall(target, toolName, latency, false)
      res.status(502).json({
        error: "Proxy error",
        detail: `Failed to reach target server: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }
}
