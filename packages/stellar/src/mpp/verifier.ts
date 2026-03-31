import type { TollConfig } from "../types.js"
import { USDC_SAC_TESTNET, USDC_SAC_MAINNET, toUsdcBaseUnits } from "../constants.js"

type RequestHandler = (req: unknown, res: unknown, next: () => void) => void | Promise<void>

// Dynamic import to handle if @stellar/mpp or mppx aren't available
async function getMppModules() {
  try {
    const stellarMppMod = await import("@stellar/mpp/charge/server")
    return { Mppx: stellarMppMod.Mppx, stellar: stellarMppMod.stellar }
  } catch {
    return null
  }
}

export class MPPVerifier {
  private config: TollConfig
  private asset: string
  // The server's Stellar secret key — used to sign MPP challenge responses
  private secretKey: string | undefined

  constructor(config: TollConfig, secretKey?: string) {
    this.config = config
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
    this.secretKey = secretKey ?? process.env.TOLL_SERVER_SECRET
  }

  createMiddleware(tool: string, priceUsdc: string): RequestHandler {
    const self = this

    const handler: RequestHandler = async (req, res, next) => {
      const modules = await getMppModules()

      // Graceful fallback: if MPP not available, pass through with warning
      if (!modules) {
        console.warn(
          `[Toll] MPP SDK not available. Tool '${tool}' serving without payment gate.`
        )
        return next()
      }

      if (!self.secretKey) {
        console.warn(
          `[Toll] TOLL_SERVER_SECRET not set. MPP tool '${tool}' serving without payment gate.`
        )
        return next()
      }

      const { Mppx, stellar } = modules

      try {
        // Create an Mppx instance per request (lightweight, stateless for Charge mode)
        const mppInstance = Mppx.create({
          secretKey: self.secretKey,
          methods: [
            stellar.charge({
              recipient: self.config.payTo,
              currency: self.asset,
              network: self.config.network === "testnet" ? "testnet" : "public",
            }),
          ],
        })

        // compose() returns Express middleware for a specific charge amount
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mppMiddleware = (mppInstance as any).compose(
          [(mppInstance as any)["stellar/charge"], { amount: toUsdcBaseUnits(priceUsdc) }]
        ) as RequestHandler

        return mppMiddleware(req, res, next)
      } catch (err) {
        console.warn(`[Toll] MPP middleware error for tool '${tool}':`, err)
        return next()
      }
    }

    return handler
  }
}
