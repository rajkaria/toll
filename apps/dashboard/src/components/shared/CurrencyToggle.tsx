"use client"

interface CurrencyToggleProps {
  currency: "usdc" | "xlm"
  onChange: (c: "usdc" | "xlm") => void
}

export function CurrencyToggle({ currency, onChange }: CurrencyToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-700 overflow-hidden text-xs">
      <button
        onClick={() => onChange("usdc")}
        className={`px-3 py-1 transition-colors ${
          currency === "usdc" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        USDC
      </button>
      <button
        onClick={() => onChange("xlm")}
        className={`px-3 py-1 transition-colors ${
          currency === "xlm" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        XLM
      </button>
    </div>
  )
}
