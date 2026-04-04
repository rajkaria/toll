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

      // Fail closed: if MPP SDK not available, reject the request
      if (!modules) {
        throw new Error(`MPP SDK not available — cannot verify payment for tool '${tool}'`)
      }

      if (!self.secretKey) {
        throw new Error(`TOLL_SERVER_SECRET not set — cannot verify MPP payment for tool '${tool}'`)
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

        // mppx expects Request with .headers.get() (Fetch API).
        // Express req has .headers as a plain object. Wrap it.
        const expressReq = req as { headers: Record<string, string | string[] | undefined> }
        const wrappedReq = {
          ...expressReq,
          headers: new Proxy(expressReq.headers, {
            get(target, prop) {
              if (prop === "get") {
                return (name: string) => {
                  const val = target[name.toLowerCase()]
                  return Array.isArray(val) ? val[0] : val ?? null
                }
              }
              return (target as Record<string | symbol, unknown>)[prop]
            },
          }),
        }

        return mppMiddleware(wrappedReq, res, next)
      } catch (err) {
        console.warn(`[Toll] MPP middleware error for tool '${tool}':`, err)
        return next()
      }
    }

    return handler
  }
}
