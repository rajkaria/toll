import type { TollConfig } from "../types.js"

/**
 * MPPVerifier — Handles MPP (Machine Payments Protocol) payment verification.
 *
 * Uses the @stellar/mpp SDK which operates on Fetch API Request/Response objects.
 * The middleware converts Express req/res to Fetch API format for compatibility.
 */

type MppChargeResult = {
  status: number
  challenge?: Response
  receipt?: Record<string, string>
}

export class MPPVerifier {
  private config: TollConfig
  private secretKey: string | undefined
  private mppxInstance: unknown | null = null
  private initPromise: Promise<void> | null = null

  constructor(config: TollConfig, secretKey?: string) {
    this.config = config
    this.secretKey = secretKey ?? process.env.TOLL_SERVER_SECRET
  }

  /** Lazily initialize the Mppx instance once */
  private async init(): Promise<unknown> {
    if (this.mppxInstance) return this.mppxInstance

    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (!this.secretKey) {
          throw new Error("TOLL_SERVER_SECRET not set — cannot verify MPP payments")
        }

        try {
          const mod = await import("@stellar/mpp/charge/server")
          const { Mppx, stellar } = mod

          const network = this.config.network === "testnet" ? "testnet" : "public"

          // Use @stellar/mpp's own USDC address for correctness
          let currency: string
          try {
            const constants = await import("@stellar/mpp")
            currency = this.config.network === "testnet"
              ? constants.USDC_SAC_TESTNET
              : constants.USDC_SAC_MAINNET
          } catch {
            // Fallback to Toll's constant if import fails
            const { USDC_SAC_TESTNET, USDC_SAC_MAINNET } = await import("../constants.js")
            currency = this.config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
          }

          this.mppxInstance = Mppx.create({
            secretKey: this.secretKey,
            methods: [
              stellar.charge({
                recipient: this.config.payTo,
                currency,
                network,
              }),
            ],
          })
        } catch (err) {
          throw new Error(`MPP SDK not available: ${err}`)
        }
      })()
    }

    await this.initPromise
    return this.mppxInstance
  }

  /**
   * Handle an MPP payment for a tool call.
   *
   * Converts Express req to Fetch Request, runs mppx.charge(), and returns
   * the result in a format the tollMiddleware can use.
   */
  async handleCharge(
    expressReq: { headers: Record<string, string | string[] | undefined>; method?: string; url?: string; protocol?: string },
    tool: string,
    priceUsdc: string
  ): Promise<{ paid: boolean; challenge?: Response; error?: string }> {
    const mppx = await this.init() as Record<string, unknown>

    // Build a Fetch API Request from Express req
    const host = (expressReq.headers["host"] as string) ?? "localhost"
    const protocol = expressReq.protocol ?? "http"
    const url = `${protocol}://${host}${expressReq.url ?? "/mcp"}`

    const fetchHeaders = new Headers()
    for (const [key, val] of Object.entries(expressReq.headers)) {
      if (val) fetchHeaders.set(key, Array.isArray(val) ? val[0] : val)
    }

    const fetchRequest = new Request(url, {
      method: expressReq.method ?? "POST",
      headers: fetchHeaders,
    })

    try {
      // Use the compose pattern: mppx['stellar/charge']({ amount })
      const chargeHandler = (mppx as Record<string, CallableFunction>)["stellar/charge"]
      if (!chargeHandler) {
        // Fallback: try mppx.stellar.charge
        const stellar = (mppx as Record<string, Record<string, CallableFunction>>).stellar
        if (!stellar?.charge) {
          throw new Error("Cannot find stellar/charge method on Mppx instance")
        }
        const handler = stellar.charge({ amount: priceUsdc, description: `MCP tool: ${tool}` })
        const result = await handler(fetchRequest) as MppChargeResult
        if (result.status === 402) {
          return { paid: false, challenge: result.challenge }
        }
        return { paid: true }
      }

      const handler = chargeHandler({ amount: priceUsdc, description: `MCP tool: ${tool}` })
      const result = await (handler as (req: Request) => Promise<MppChargeResult>)(fetchRequest)

      if (result.status === 402) {
        return { paid: false, challenge: result.challenge }
      }
      return { paid: true }
    } catch (err) {
      return { paid: false, error: String(err) }
    }
  }
}
