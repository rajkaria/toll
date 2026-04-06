import { createHash } from "node:crypto"

export interface PricingRule {
  condition: string // e.g. "hour >= 9 && hour <= 17"
  price: string
}

export interface TierConfig {
  name: string
  calls: number | null // null = unlimited (catch-all)
  price: string
}

export interface ABTestConfig {
  enabled: boolean
  variants: Array<{ name: string; price: string; weight: number }>
}

export interface PricingContext {
  hour: number
  callerId: string
  callerCallCount: number // cumulative calls for this tool
  recentCallsPerHour?: number
}

export interface PricingResult {
  price: string
  strategy: "static" | "time_of_day" | "tiered" | "ab_test" | "demand"
  variant?: string
  tier?: string
}

export interface ToolPricingConfig {
  type?: "static" | "time_of_day" | "demand" | "tiered"
  rules?: PricingRule[]
  minPrice?: string
  maxPrice?: string
}

export class PricingEngine {
  /**
   * Resolve the price for a tool call given context.
   * Checks in order: A/B test → tiers → dynamic pricing → static fallback
   */
  resolvePrice(
    toolName: string,
    basePrice: string,
    context: PricingContext,
    options?: {
      pricing?: ToolPricingConfig
      tiers?: TierConfig[]
      abTest?: ABTestConfig
    }
  ): PricingResult {
    // 1. A/B Test (takes priority if active)
    if (options?.abTest?.enabled && options.abTest.variants.length > 0) {
      const variant = this.getABVariant(context.callerId, toolName, options.abTest)
      return { price: variant.price, strategy: "ab_test", variant: variant.name }
    }

    // 2. Tiered Pricing
    if (options?.tiers?.length) {
      const tier = this.resolveTier(context.callerCallCount, options.tiers)
      if (tier) return { price: tier.price, strategy: "tiered", tier: tier.name }
    }

    // 3. Dynamic Pricing
    if (options?.pricing?.type && options.pricing.type !== "static") {
      const dynPrice = this.resolveDynamic(context, options.pricing)
      if (dynPrice) {
        const clamped = this.clamp(dynPrice, options.pricing.minPrice, options.pricing.maxPrice)
        return { price: clamped, strategy: options.pricing.type as PricingResult["strategy"] }
      }
    }

    // 4. Static fallback
    return { price: basePrice, strategy: "static" }
  }

  private getABVariant(
    callerId: string,
    toolName: string,
    config: ABTestConfig
  ): { name: string; price: string } {
    // Deterministic assignment via hash
    const hash = createHash("md5").update(`${callerId}:${toolName}:abtest`).digest()
    const bucket = hash.readUInt16BE(0) % 100

    let cumulative = 0
    for (const variant of config.variants) {
      cumulative += variant.weight
      if (bucket < cumulative) return variant
    }
    return config.variants[config.variants.length - 1]
  }

  private resolveTier(callCount: number, tiers: TierConfig[]): TierConfig | null {
    // Sort tiers by calls ascending, nulls last
    const sorted = [...tiers].sort((a, b) => {
      if (a.calls === null) return 1
      if (b.calls === null) return -1
      return a.calls - b.calls
    })

    for (const tier of sorted) {
      if (tier.calls === null || callCount < tier.calls) return tier
    }
    return sorted[sorted.length - 1]
  }

  private resolveDynamic(context: PricingContext, config: ToolPricingConfig): string | null {
    if (config.type === "time_of_day" && config.rules) {
      for (const rule of config.rules) {
        if (this.evaluateCondition(rule.condition, context)) return rule.price
      }
    }

    if (config.type === "demand" && context.recentCallsPerHour !== undefined) {
      // Simple demand-based: scale price linearly with demand
      const baseMultiplier = Math.max(1, context.recentCallsPerHour / 100)
      const base = parseFloat(config.minPrice ?? "0.01")
      return (base * baseMultiplier).toFixed(4)
    }

    return null
  }

  private evaluateCondition(condition: string, context: PricingContext): boolean {
    try {
      // Safe evaluation: only allow hour comparisons
      const { hour } = context
      const sanitized = condition.replace(/[^0-9<>=&|! hour]/g, "")
      return new Function("hour", `return ${sanitized}`)(hour) as boolean
    } catch {
      return false
    }
  }

  private clamp(price: string, min?: string, max?: string): string {
    let p = parseFloat(price)
    if (min) p = Math.max(p, parseFloat(min))
    if (max) p = Math.min(p, parseFloat(max))
    return p.toFixed(4)
  }
}
