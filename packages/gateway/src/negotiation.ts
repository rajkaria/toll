import { createHmac } from "node:crypto"

export interface NegotiableConfig {
  enabled: boolean
  minPrice: string
  maxDiscount: string // e.g. "0.50" = 50%
  factors?: ("volume" | "loyalty" | "bundle")[]
}

export interface NegotiationProposal {
  tool: string
  callerId: string
  proposedPrice: string
  context?: { volumeLast30d?: number; daysSinceFirstCall?: number; hasBundle?: boolean }
}

export interface NegotiationResult {
  accepted: boolean
  price: string
  discount: number // percentage
  reason: string
  priceLockToken?: string
  priceLockExpires?: number
}

export class Negotiator {
  private serverSecret: string

  constructor(serverSecret?: string) {
    this.serverSecret = serverSecret ?? process.env.TOLL_SERVER_SECRET ?? "toll-negotiate"
  }

  evaluate(
    proposal: NegotiationProposal,
    basePrice: string,
    config: NegotiableConfig
  ): NegotiationResult {
    const base = parseFloat(basePrice)
    const min = parseFloat(config.minPrice)
    const proposed = parseFloat(proposal.proposedPrice)
    const maxDiscount = parseFloat(config.maxDiscount)

    if (proposed >= base) {
      return this.accept(proposed, base, 0, "Full price accepted")
    }

    if (proposed < min) {
      return { accepted: false, price: basePrice, discount: 0, reason: `Below minimum ($${min})` }
    }

    // Calculate earned discount based on factors
    let discount = 0
    const factors = config.factors ?? ["volume", "loyalty"]

    if (factors.includes("volume") && proposal.context?.volumeLast30d) {
      // 10% discount per 100 calls, max 30%
      discount += Math.min(0.3, (proposal.context.volumeLast30d / 100) * 0.1)
    }

    if (factors.includes("loyalty") && proposal.context?.daysSinceFirstCall) {
      // 5% per 30 days, max 15%
      discount += Math.min(0.15, (proposal.context.daysSinceFirstCall / 30) * 0.05)
    }

    if (factors.includes("bundle") && proposal.context?.hasBundle) {
      discount += 0.1 // 10% for bundle holders
    }

    discount = Math.min(discount, maxDiscount)
    const discountedPrice = base * (1 - discount)

    if (proposed >= discountedPrice) {
      return this.accept(proposed, base, discount * 100, "Discount applied based on usage")
    }

    // Counter-offer at discounted price
    return {
      accepted: false,
      price: discountedPrice.toFixed(4),
      discount: discount * 100,
      reason: `Counter-offer: $${discountedPrice.toFixed(4)} (${(discount * 100).toFixed(0)}% discount)`,
    }
  }

  private accept(price: number, base: number, discount: number, reason: string): NegotiationResult {
    const expires = Date.now() + 5 * 60 * 1000 // 5 min
    const payload = `${price}:${expires}`
    const token = createHmac("sha256", this.serverSecret).update(payload).digest("hex")

    return {
      accepted: true,
      price: price.toFixed(4),
      discount,
      reason,
      priceLockToken: `${payload}:${token}`,
      priceLockExpires: expires,
    }
  }

  /** Verify a price lock token */
  verifyPriceLock(token: string): { valid: boolean; price?: number } {
    const parts = token.split(":")
    if (parts.length !== 3) return { valid: false }

    const [priceStr, expiresStr, sig] = parts
    const expectedSig = createHmac("sha256", this.serverSecret).update(`${priceStr}:${expiresStr}`).digest("hex")

    if (sig !== expectedSig) return { valid: false }
    if (parseInt(expiresStr) < Date.now()) return { valid: false }

    return { valid: true, price: parseFloat(priceStr) }
  }
}
