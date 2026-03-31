interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${accent ? "border-emerald-500/40 bg-emerald-950/30" : "border-gray-700/50 bg-gray-900/50"}`}>
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accent ? "text-emerald-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
