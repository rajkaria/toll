import type { EarningsRecord } from "@/lib/types"

interface RecentTransactionsProps {
  records: EarningsRecord[]
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RecentTransactions({ records }: RecentTransactionsProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Recent Transactions</h2>
      </div>
      <div className="divide-y divide-gray-800/50">
        {records.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600 text-xs">
            No transactions yet
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{r.tool}</p>
                <p className="text-xs text-gray-500 truncate">
                  {r.caller ? `${r.caller.slice(0, 8)}…` : "anonymous"}
                  {r.txHash && (
                    <span className="ml-2 text-gray-600 font-mono">
                      tx:{r.txHash.slice(0, 8)}…
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-emerald-400 font-medium tabular-nums">
                  ${r.amountUsdc.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500">
                  <span className={`mr-1.5 ${r.protocol === "x402" ? "text-blue-400" : "text-purple-400"}`}>
                    {r.protocol}
                  </span>
                  {timeAgo(r.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
