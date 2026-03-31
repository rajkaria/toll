export interface OverallStats {
  totalEarnings: number
  totalCalls: number
  todayEarnings: number
  todayCalls: number
}

export interface ToolStats {
  tool: string
  calls: number
  revenue: number
  avgPrice: number
}

export interface EarningsRecord {
  id: string
  tool: string
  caller: string | null
  amountUsdc: number
  protocol: string
  txHash: string | null
  createdAt: number
}

export interface ProtocolSplit {
  x402: number
  mpp: number
}

export interface EarningsData {
  stats: OverallStats
  byTool: ToolStats[]
  recent: EarningsRecord[]
  protocolSplit: ProtocolSplit
}
