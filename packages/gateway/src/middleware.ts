import type { Request, Response, NextFunction, RequestHandler } from "express"
import {
  X402Verifier,
  MPPVerifier,
  EarningsTracker,
  type TollConfig,
} from "@toll/stellar"
import { RateLimiter } from "./rateLimiter.js"
import { isFree } from "./config.js"

const X402_HEADER = "payment-signature"

function getCallerId(req: Request): string {
  return req.ip ?? "anonymous"
}

function isMcpToolCall(
  body: unknown
): body is { method: "tools/call"; params: { name: string } } {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).method === "tools/call" &&
    typeof (body as Record<string, unknown>).params === "object"
  )
}

export function tollMiddleware(config: TollConfig): RequestHandler {
  const x402 = new X402Verifier(config)
  const mpp = new MPPVerifier(config)
  const earnings = new EarningsTracker(config.dataDir)
  const rateLimiter = new RateLimiter()

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only intercept MCP tool calls
    if (!isMcpToolCall(req.body)) {
      next()
      return
    }

    const toolName = req.body.params.name
    const toolConfig = config.tools[toolName]

    // Unknown tool or explicitly free — pass through
    if (!toolConfig || isFree(toolConfig)) {
      next()
      return
    }

    const callerId = getCallerId(req)

    // Check free tier rate limit
    if (rateLimiter.isWithinFreeTier(callerId, toolName, toolConfig)) {
      rateLimiter.increment(callerId, toolName)
      next()
      return
    }

    const protocol = toolConfig.paymentMode ?? config.defaultPaymentMode
    const host = req.get("host") ?? "localhost"
    const resourceUrl = `${req.protocol}://${host}${req.path}`

    if (protocol === "x402") {
      const paymentHeader = req.headers[X402_HEADER] as string | undefined

      if (!paymentHeader) {
        const requirements = x402.buildRequirements(toolName, toolConfig.price, resourceUrl)
        res.status(402).json({
          ...requirements,
          "payment-required": x402.encodeRequirements(requirements),
        })
        return
      }

      const requirements = x402.buildRequirements(toolName, toolConfig.price, resourceUrl)
      const result = await x402.settle(paymentHeader, requirements)

      if (!result.success) {
        res.status(402).json({ error: result.error ?? "Payment verification failed" })
        return
      }

      earnings.record({
        tool: toolName,
        caller: result.payer ?? callerId,
        amountUsdc: parseFloat(toolConfig.price),
        protocol: "x402",
        txHash: result.transaction ?? null,
      })

      next()
      return
    }

    if (protocol === "mpp") {
      const mppHandler = mpp.createMiddleware(toolName, toolConfig.price)
      mppHandler(req, res, () => {
        earnings.record({
          tool: toolName,
          caller: callerId,
          amountUsdc: parseFloat(toolConfig.price),
          protocol: "mpp",
          txHash: null,
        })
        next()
      })
    }
  }
}
