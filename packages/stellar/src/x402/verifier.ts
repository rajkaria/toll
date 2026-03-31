import { toUsdcBaseUnits, USDC_SAC_TESTNET, USDC_SAC_MAINNET } from "../constants.js"
import type {
  TollConfig,
  PaymentRequired,
  PaymentRequiredAccept,
  X402SettleResult,
} from "../types.js"

export class X402Verifier {
  private facilitatorUrl: string
  private payTo: string
  private network: string
  private asset: string

  constructor(config: TollConfig) {
    this.facilitatorUrl = config.facilitatorUrl.replace(/\/$/, "")
    this.payTo = config.payTo
    this.network = config.network === "testnet" ? "stellar:testnet" : "stellar:pubnet"
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
  }

  buildRequirements(
    tool: string,
    priceUsdc: string,
    resourceUrl: string
  ): PaymentRequired {
    const accept: PaymentRequiredAccept = {
      scheme: "exact",
      network: this.network,
      asset: this.asset,
      payTo: this.payTo,
      amount: toUsdcBaseUnits(priceUsdc),
      maxTimeoutSeconds: 300,
      description: `Payment for MCP tool: ${tool} (${priceUsdc} USDC)`,
      extra: { areFeesSponsored: true },
    }
    return {
      x402Version: 2,
      accepts: [accept],
      resource: { url: resourceUrl, description: `MCP tool: ${tool}` },
    }
  }

  // Encode requirements as base64 for the PAYMENT-REQUIRED header
  encodeRequirements(requirements: PaymentRequired): string {
    return Buffer.from(JSON.stringify(requirements)).toString("base64")
  }

  async settle(
    paymentSignatureHeader: string,
    requirements: PaymentRequired
  ): Promise<X402SettleResult> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: paymentSignatureHeader,
          paymentRequirements: requirements,
        }),
      })

      const data = (await response.json()) as Record<string, unknown>

      if (!response.ok) {
        return {
          success: false,
          error: (data.error as string) ?? `Facilitator responded ${response.status}`,
        }
      }

      return {
        success: (data.success as boolean) ?? false,
        transaction: data.transaction as string | undefined,
        payer: data.payer as string | undefined,
        error: data.error as string | undefined,
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}
