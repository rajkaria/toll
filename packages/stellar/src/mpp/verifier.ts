import type { RequestHandler } from "express"
import type { TollConfig } from "../types.js"
import { USDC_SAC_TESTNET, USDC_SAC_MAINNET, toUsdcBaseUnits } from "../constants.js"

// Dynamic import to handle if @stellar/mpp or mppx aren't available
async function getMppModules() {
  try {
    const [mppxMod, stellarMppMod] = await Promise.all([
      import("mppx"),
      import("@stellar/mpp/charge/server"),
    ])
    return { Mppx: mppxMod.Mppx, stellar: stellarMppMod.stellar }
  } catch {
    return null
  }
}

export class MPPVerifier {
  private config: TollConfig
  private asset: string

  constructor(config: TollConfig) {
    this.config = config
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
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

      const { Mppx, stellar } = modules

      try {
        const mppInstance = Mppx.create({
          methods: [
            stellar.charge({
              recipient: self.config.payTo,
              currency: self.asset,
              network: self.config.network === "testnet" ? "testnet" : "public",
              amount: toUsdcBaseUnits(priceUsdc),
            }),
          ],
        })

        // mppx middleware handles WWW-Authenticate / Authorization: Payment flow
        const mppMiddleware = mppInstance.middleware()
        return mppMiddleware(req, res, next)
      } catch (err) {
        console.warn(`[Toll] MPP middleware error for tool '${tool}':`, err)
        return next()
      }
    }

    return handler
  }
}
