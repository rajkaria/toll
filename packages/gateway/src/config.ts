import { z } from "zod"
import fs from "node:fs"
import type { TollConfig } from "@toll/stellar"

const ToolConfigSchema = z.object({
  price: z.string().regex(/^\d+(\.\d+)?$/, "Price must be a decimal string like '0.01'"),
  currency: z.literal("USDC"),
  description: z.string().optional(),
  paymentMode: z.enum(["x402", "mpp"]).optional(),
  rateLimit: z
    .object({
      free: z.number().int().nonnegative(),
      perHour: z.boolean(),
      paidPrice: z.string(),
    })
    .optional(),
})

const SpendingPolicySchema = z.object({
  maxPerCall: z.string().optional(),
  maxDailyPerCaller: z.string().optional(),
  maxDailyGlobal: z.string().optional(),
  allowedCallers: z.array(z.string()).optional(),
  blockedCallers: z.array(z.string()).optional(),
}).optional()

const ApiKeySchema = z.record(z.string(), z.object({
  name: z.string(),
  allowedTools: z.array(z.string()).optional(),
  maxDailySpend: z.string().optional(),
})).optional()

const TollConfigSchema = z.object({
  network: z.enum(["testnet", "mainnet"]),
  payTo: z.string().min(56, "payTo must be a valid Stellar address"),
  facilitatorUrl: z.string().url(),
  defaultPaymentMode: z.enum(["x402", "mpp"]),
  tools: z.record(z.string(), ToolConfigSchema),
  mpp: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),
  dataDir: z.string().optional(),
  spendingPolicy: SpendingPolicySchema,
  apiKeys: ApiKeySchema,
})

export function validateConfig(raw: unknown): TollConfig {
  return TollConfigSchema.parse(raw) as TollConfig
}

export function loadConfig(configPath: string): TollConfig {
  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as unknown
  return validateConfig(raw)
}

export function isFree(tool: { price: string }): boolean {
  return parseFloat(tool.price) === 0
}
