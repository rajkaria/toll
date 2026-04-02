interface BarChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}

export function BarChart({ data, height = 200, color = "bg-emerald-400" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div style={{ height }} className="flex items-end gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: height - 24 }}>
            <div
              className={`w-full rounded-t ${color} transition-all duration-500`}
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
            />
          </div>
          <span className="text-[10px] text-gray-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
