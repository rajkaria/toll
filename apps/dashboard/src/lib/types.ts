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

export interface DayEarnings {
  day: string
  earnings: number
}

export interface HourCalls {
  hour: string
  calls: number
}

export interface TopCaller {
  caller: string
  calls: number
  total: number
}

export interface Analytics {
  earningsPerDay: DayEarnings[]
  callsPerHour: HourCalls[]
  topCallers: TopCaller[]
}

export interface EarningsData {
  stats: OverallStats
  byTool: ToolStats[]
  recent: EarningsRecord[]
  protocolSplit: ProtocolSplit
  analytics: Analytics
}
