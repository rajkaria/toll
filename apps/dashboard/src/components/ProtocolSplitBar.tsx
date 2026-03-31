import type { ProtocolSplit } from "@/lib/types"

interface ProtocolSplitBarProps {
  split: ProtocolSplit
}

export function ProtocolSplitBar({ split }: ProtocolSplitBarProps) {
  const hasData = split.x402 > 0 || split.mpp > 0

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Protocol Split</p>
      {!hasData ? (
        <p className="text-xs text-gray-600">No data yet</p>
      ) : (
        <>
          <div className="flex rounded-full overflow-hidden h-3 mb-3">
            {split.x402 > 0 && (
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${split.x402}%` }}
              />
            )}
            {split.mpp > 0 && (
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${split.mpp}%` }}
              />
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-400">x402 — {split.x402}%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-gray-400">MPP — {split.mpp}%</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
