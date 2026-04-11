export interface TollClientConfig {
  serverUrl: string
  secretKey?: string // Stellar secret for signing payments
  budget?: {
    maxPerCall?: string
    maxDaily?: string
  }
  sessionEnabled?: boolean
  autoRetry?: boolean // auto-retry on 402, default true
  autoCreateWallet?: boolean // auto-create Stellar wallet if no secretKey, default true
  network?: "mainnet" | "testnet" // Stellar network, default mainnet
}

export interface TollWallet {
  publicKey: string
  secretKey: string
  createdAt: string
  network: "mainnet" | "testnet"
}

export interface ToolCallResult {
  success: boolean
  data?: unknown
  paid: boolean
  amount?: string
  protocol?: string
  txHash?: string
  error?: string
}

export interface ServerManifest {
  tools: Array<{
    name: string
    price: string
    currency: string
    paymentMode: string
    description: string | null
    free: boolean
  }>
  count: number
  network: string
}

export interface SpendingReport {
  totalSpent: number
  callCount: number
  byTool: Record<string, { spent: number; calls: number }>
  dailyBudget: number | null
  dailyRemaining: number | null
}

export type TollEventType = "payment" | "error" | "budget_warning" | "tool_called"
export type TollEventHandler = (event: TollEventType, data: Record<string, unknown>) => void
