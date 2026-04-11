"use client"

import { QualityBadge } from "./QualityBadge"

interface ToolSearchCardProps {
  name: string
  description: string | null
  price: string
  currency: string
  protocol: string
  category: string
  qualityScore: number
  totalCalls: number
  server: { name: string; url: string; network: string }
  onConnect: () => void
}

export function ToolSearchCard(props: ToolSearchCardProps) {
  const isFree = parseFloat(props.price) === 0
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-5 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{props.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{props.server.name}</p>
        </div>
        <QualityBadge score={props.qualityScore} />
      </div>

      <p className="text-gray-400 text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
        {props.description ?? "No description available"}
      </p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          isFree
            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
            : "text-white bg-white/10 border-white/20"
        }`}>
          {isFree ? "FREE" : `$${props.price} ${props.currency}`}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20">
          {props.protocol}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full border text-gray-400 bg-gray-400/10 border-gray-400/20">
          {props.category}
        </span>
        {props.totalCalls > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {props.totalCalls.toLocaleString()} calls
          </span>
        )}
      </div>

      <button
        onClick={props.onConnect}
        className="w-full text-sm font-medium py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
      >
        Connect
      </button>
    </div>
  )
}
