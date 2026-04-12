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
  private secretKey?: string
  private rpcUrl?: string
  private localFacilitator: unknown | null = null

  constructor(config: TollConfig) {
    this.facilitatorUrl = config.facilitatorUrl.replace(/\/$/, "")
    this.payTo = config.payTo
    this.network = config.network === "testnet" ? "stellar:testnet" : "stellar:pubnet"
    this.asset = config.network === "testnet" ? USDC_SAC_TESTNET : USDC_SAC_MAINNET
    this.secretKey = config.secretKey
    this.rpcUrl = config.rpcUrl
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

  /** Get or create the local x402 facilitator (self-hosted settlement) */
  private async getLocalFacilitator(): Promise<{
    settle: (payload: unknown, requirements: unknown) => Promise<{ success: boolean; transaction?: string; payer?: string; error?: string }>
  }> {
    if (this.localFacilitator) return this.localFacilitator as ReturnType<typeof this.getLocalFacilitator> extends Promise<infer T> ? T : never

    const { createEd25519Signer } = await import("@x402/stellar")
    const { x402Facilitator } = await import("@x402/core/facilitator")
    // Facilitator-side scheme has settle/verify (different from client-side)
    const { ExactStellarScheme: FacilitatorScheme } = await import("@x402/stellar/exact/facilitator")
    const signer = createEd25519Signer(this.secretKey!)
    const rpcConfig = this.rpcUrl ? { url: this.rpcUrl } : undefined

    // Facilitator scheme takes array of signers + options
    const scheme = new FacilitatorScheme([signer], { rpcConfig, areFeesSponsored: true })
    const facilitator = new x402Facilitator()
    facilitator.register(["stellar:pubnet", "stellar:testnet"], scheme)

    this.localFacilitator = facilitator
    return facilitator as unknown as ReturnType<typeof this.getLocalFacilitator> extends Promise<infer T> ? T : never
  }

  async settle(
    paymentSignatureHeader: string,
    requirements: PaymentRequired
  ): Promise<X402SettleResult> {
    // If we have a secret key, use local facilitator (self-hosted settlement)
    if (this.secretKey) {
      return this.settleLocal(paymentSignatureHeader, requirements)
    }

    // Otherwise, use remote facilitator
    return this.settleRemote(paymentSignatureHeader, requirements)
  }

  private async settleLocal(
    paymentSignatureHeader: string,
    requirements: PaymentRequired
  ): Promise<X402SettleResult> {
    try {
      // Parse the payment signature
      const parsed = JSON.parse(
        Buffer.from(paymentSignatureHeader, "base64").toString("utf-8")
      )

      const facilitator = await this.getLocalFacilitator()
      // The facilitator expects (paymentPayload, acceptedRequirements)
      // The client's payload includes `accepted` field with the requirements it chose
      const result = await facilitator.settle(parsed, parsed.accepted ?? requirements.accepts[0])

      return {
        success: result.success ?? false,
        transaction: result.transaction,
        payer: result.payer,
        error: result.error,
      }
    } catch (err) {
      return { success: false, error: `Local settle failed: ${String(err)}` }
    }
  }

  private async settleRemote(
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
