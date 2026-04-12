export interface TollToolConfig {
  price: string // e.g. "0.01" USDC, "0" for free
  currency: "USDC"
  description?: string
  paymentMode?: "x402" | "mpp"
  rateLimit?: {
    free: number
    perHour: boolean
    paidPrice: string
  }
}

export interface TollConfig {
  network: "testnet" | "mainnet"
  payTo: string // Stellar G... address
  facilitatorUrl: string
  defaultPaymentMode: "x402" | "mpp"
  tools: Record<string, TollToolConfig>
  mpp?: {
    enabled: boolean
  }
  secretKey?: string // Stellar secret key for self-hosted settlement (no external facilitator)
  rpcUrl?: string // Soroban RPC URL for mainnet (required for self-hosted settlement)
  dataDir?: string // path to SQLite dir, default ~/.toll
  /** Spending policies — Toll's trust primitive */
  spendingPolicy?: {
    maxPerCall?: string // max USDC per single call
    maxDailyPerCaller?: string // max USDC per caller per day
    maxDailyGlobal?: string // max USDC total per day
    allowedCallers?: string[] // Stellar addresses allowed
    blockedCallers?: string[] // Stellar addresses blocked
  }
  /** API key authentication for caller identification */
  apiKeys?: Record<string, {
    name: string
    allowedTools?: string[] // restrict to specific tools
    maxDailySpend?: string // per-key budget override
  }>
}

export interface PaymentRequired {
  x402Version: number
  accepts: PaymentRequiredAccept[]
  resource?: { url: string; description?: string }
  error?: string
}

export interface PaymentRequiredAccept {
  scheme: "exact"
  network: string
  asset: string
  payTo: string
  amount: string
  maxTimeoutSeconds: number
  description?: string
  extra?: Record<string, unknown>
}

export interface X402SettleResult {
  success: boolean
  transaction?: string // tx hash
  payer?: string // Stellar address that paid
  error?: string
}

export interface EarningsRecord {
  id: string
  tool: string
  caller: string | null
  amountUsdc: number
  protocol: "x402" | "mpp"
  txHash: string | null
  createdAt: number // unix timestamp ms
}
