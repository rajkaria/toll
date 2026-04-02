interface MiniTableProps {
  data: { caller: string; calls: number; total: number }[]
}

export function MiniTable({ data }: MiniTableProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Top Callers</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
            <th className="px-6 py-3 text-left">#</th>
            <th className="px-6 py-3 text-left">Caller</th>
            <th className="px-6 py-3 text-right">Calls</th>
            <th className="px-6 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-600 text-xs">
                No caller data yet
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.caller} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-3 text-gray-600 text-xs">{i + 1}</td>
                <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                  {row.caller.length > 12 ? `${row.caller.slice(0, 8)}...${row.caller.slice(-4)}` : row.caller}
                </td>
                <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{row.calls}</td>
                <td className="px-6 py-3 text-right text-emerald-400 tabular-nums font-medium">
                  ${row.total.toFixed(4)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
