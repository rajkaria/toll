interface AreaChartProps {
  data: { label: string; value: number }[]
  height?: number
  width?: number
}

export function AreaChart({ data, height = 200, width = 500 }: AreaChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-gray-600">
        No data
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.value), 0.001)
  const padding = { top: 10, right: 10, bottom: 30, left: 50 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.value / max) * chartH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  // Y-axis labels
  const yLabels = [0, max / 2, max].map((v) => ({
    value: v < 0.01 ? v.toFixed(4) : v < 1 ? v.toFixed(2) : v.toFixed(0),
    y: padding.top + chartH - (v / max) * chartH,
  }))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {yLabels.map((l, i) => (
        <line key={i} x1={padding.left} x2={width - padding.right} y1={l.y} y2={l.y} stroke="#1f2937" strokeWidth={1} />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="rgb(52, 211, 153)" fillOpacity={0.1} />

      {/* Line */}
      <path d={linePath} fill="none" stroke="rgb(52, 211, 153)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgb(52, 211, 153)" />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((l, i) => (
        <text key={i} x={padding.left - 6} y={l.y + 3} textAnchor="end" className="text-[10px] fill-gray-600">
          ${l.value}
        </text>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW}
          y={height - 6}
          textAnchor="middle"
          className="text-[10px] fill-gray-600"
        >
          {d.label}
        </text>
      ))}
    </svg>
  )
}
