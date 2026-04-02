const STYLES: Record<string, string> = {
  x402: "bg-blue-900/60 text-blue-300",
  mpp: "bg-purple-900/60 text-purple-300",
  free: "bg-gray-700 text-gray-400",
}

export function ProtocolBadge({ protocol }: { protocol: "x402" | "mpp" | "free" }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STYLES[protocol]}`}>
      {protocol === "free" ? "FREE" : protocol.toUpperCase()}
    </span>
  )
}
