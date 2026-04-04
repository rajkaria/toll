import { describe, it, expect, beforeEach } from "vitest"
import { RateLimiter } from "./rateLimiter.js"
import type { TollToolConfig } from "@toll/stellar"

const freeWithLimit: TollToolConfig = {
  price: "0",
  currency: "USDC",
  rateLimit: { free: 3, perHour: true, paidPrice: "0.001" },
}

describe("RateLimiter", () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter()
  })

  it("allows free calls within the limit", () => {
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(true)
    limiter.increment("caller1", "tool", freeWithLimit)
    limiter.increment("caller1", "tool", freeWithLimit)
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(true)
  })

  it("blocks after free tier exceeded", () => {
    limiter.increment("caller1", "tool", freeWithLimit)
    limiter.increment("caller1", "tool", freeWithLimit)
    limiter.increment("caller1", "tool", freeWithLimit)
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(false)
  })

  it("allows calls on tools with no rate limit", () => {
    const noLimit: TollToolConfig = { price: "0.01", currency: "USDC" }
    expect(limiter.isWithinFreeTier("caller1", "tool", noLimit)).toBe(false)
  })

  it("different callers are tracked independently", () => {
    limiter.increment("caller1", "tool", freeWithLimit)
    limiter.increment("caller1", "tool", freeWithLimit)
    limiter.increment("caller1", "tool", freeWithLimit)
    expect(limiter.isWithinFreeTier("caller2", "tool", freeWithLimit)).toBe(true)
    expect(limiter.isWithinFreeTier("caller1", "tool", freeWithLimit)).toBe(false)
  })
})
