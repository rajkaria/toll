import type { Request, Response, NextFunction, RequestHandler } from "express"
import {
  X402Verifier,
  MPPVerifier,
  EarningsTracker,
  type TollConfig,
} from "@toll/stellar"
import { RateLimiter } from "./rateLimiter.js"
import { isFree } from "./config.js"
import { SpendingPolicy } from "./spendingPolicy.js"

const X402_HEADER = "payment-signature"
const API_KEY_HEADER = "x-toll-api-key"

function getCallerId(req: Request, config: TollConfig): string {
  // API key takes precedence over IP for caller identification
  const apiKey = req.headers[API_KEY_HEADER] as string | undefined
  if (apiKey && config.apiKeys?.[apiKey]) {
    return `key:${apiKey}`
  }
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

// Replay protection: track used payment signatures with TTL
const REPLAY_TTL_MS = 5 * 60 * 1000 // 5 minutes
class ReplayGuard {
  private used = new Map<string, number>()

  check(signature: string): boolean {
    this.cleanup()
    return this.used.has(signature)
  }

  mark(signature: string): void {
    this.used.set(signature, Date.now())
  }

  private cleanup(): void {
    const cutoff = Date.now() - REPLAY_TTL_MS
    for (const [sig, ts] of this.used) {
      if (ts < cutoff) this.used.delete(sig)
    }
  }
}

export function tollMiddleware(config: TollConfig): RequestHandler {
  const x402 = new X402Verifier(config)
  const mpp = new MPPVerifier(config)
  const earnings = new EarningsTracker(config.dataDir)
  const rateLimiter = new RateLimiter()
  const replayGuard = new ReplayGuard()
  const spendingPolicy = new SpendingPolicy(config.spendingPolicy ?? {})

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

    const callerId = getCallerId(req, config)

    // API key validation: check tool access restrictions
    const apiKey = req.headers[API_KEY_HEADER] as string | undefined
    if (apiKey) {
      const keyConfig = config.apiKeys?.[apiKey]
      if (!keyConfig) {
        res.status(401).json({ error: "Invalid API key" })
        return
      }
      if (keyConfig.allowedTools?.length && !keyConfig.allowedTools.includes(toolName)) {
        res.status(403).json({ error: `API key not authorized for tool '${toolName}'` })
        return
      }
    }

    // Spending policy enforcement (BEFORE payment)
    const policyViolation = spendingPolicy.check(callerId, toolConfig.price)
    if (policyViolation) {
      res.status(429).json({
        error: "Spending policy violation",
        reason: policyViolation,
        tool: toolName,
        price: toolConfig.price,
      })
      return
    }

    // Check free tier rate limit
    if (rateLimiter.isWithinFreeTier(callerId, toolName, toolConfig)) {
      rateLimiter.increment(callerId, toolName, toolConfig)
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

      // Replay protection: reject already-used payment signatures
      if (replayGuard.check(paymentHeader)) {
        res.status(402).json({ error: "Payment signature already used (replay rejected)" })
        return
      }

      const requirements = x402.buildRequirements(toolName, toolConfig.price, resourceUrl)
      const result = await x402.settle(paymentHeader, requirements)

      if (!result.success) {
        res.status(402).json({ error: result.error ?? "Payment verification failed" })
        return
      }

      // Mark signature as used (replay protection)
      replayGuard.mark(paymentHeader)

      // Record spend for policy tracking
      spendingPolicy.record(callerId, parseFloat(toolConfig.price))

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
      // Use the new MPP verifier that handles Fetch API conversion internally
      try {
        const result = await mpp.handleCharge(
          { headers: req.headers as Record<string, string | string[] | undefined>, method: req.method, url: req.url, protocol: req.protocol },
          toolName,
          toolConfig.price
        )

        if (!result.paid) {
          // Return 402 with MPP challenge
          if (result.challenge) {
            // Forward the SDK's challenge response headers
            const challengeHeaders: Record<string, string> = {}
            result.challenge.headers.forEach((val: string, key: string) => {
              challengeHeaders[key] = val
            })
            const body = await result.challenge.text()
            res.status(402)
            for (const [k, v] of Object.entries(challengeHeaders)) {
              res.set(k, v)
            }
            res.send(body)
          } else {
            // Fallback 402 if no challenge from SDK
            res.status(402)
              .set("WWW-Authenticate", `Payment realm="Toll MPP", asset="${toolConfig.currency}", amount="${toolConfig.price}", network="${config.network}", payTo="${config.payTo}"`)
              .json({
                error: result.error ?? "MPP payment required",
                protocol: "mpp",
                tool: toolName,
                price: toolConfig.price,
                currency: toolConfig.currency,
                payTo: config.payTo,
                network: config.network,
              })
          }
          return
        }

        // Payment verified — record and continue
        spendingPolicy.record(callerId, parseFloat(toolConfig.price))
        earnings.record({
          tool: toolName,
          caller: callerId,
          amountUsdc: parseFloat(toolConfig.price),
          protocol: "mpp",
          txHash: null,
        })
        next()
      } catch (err) {
        console.error(`[Toll] MPP verification failed for tool '${toolName}':`, err)
        res.status(402).json({
          error: "MPP payment verification failed",
          protocol: "mpp",
          tool: toolName,
        })
        return
      }
    }
  }
}
