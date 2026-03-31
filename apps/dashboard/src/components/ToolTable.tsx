import type { ToolStats } from "@/lib/types"

const PROTOCOL_LABELS: Record<string, string> = {
  health_check: "FREE",
  search_competitors: "x402",
  analyze_sentiment: "x402",
  compare_products: "MPP",
}

interface ToolTableProps {
  tools: ToolStats[]
}

export function ToolTable({ tools }: ToolTableProps) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Tool Revenue</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
            <th className="px-6 py-3 text-left">Tool</th>
            <th className="px-6 py-3 text-left">Protocol</th>
            <th className="px-6 py-3 text-right">Calls</th>
            <th className="px-6 py-3 text-right">Revenue</th>
            <th className="px-6 py-3 text-right">Avg Price</th>
          </tr>
        </thead>
        <tbody>
          {tools.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-600 text-xs">
                No transactions yet — run the demo agent to generate data
              </td>
            </tr>
          ) : (
            tools.map((tool) => (
              <tr key={tool.tool} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-3 text-gray-200 font-medium">{tool.tool}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${PROTOCOL_LABELS[tool.tool] === "FREE" ? "bg-gray-700 text-gray-400" :
                      PROTOCOL_LABELS[tool.tool] === "x402" ? "bg-blue-900/60 text-blue-300" :
                      "bg-purple-900/60 text-purple-300"}`}>
                    {PROTOCOL_LABELS[tool.tool] ?? "x402"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right text-gray-300 tabular-nums">{tool.calls}</td>
                <td className="px-6 py-3 text-right text-emerald-400 tabular-nums font-medium">
                  ${tool.revenue.toFixed(4)}
                </td>
                <td className="px-6 py-3 text-right text-gray-400 tabular-nums">
                  ${tool.avgPrice.toFixed(4)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
