"use client"

import { useState } from "react"

const TOOL_PRICES = [
  { name: "search_competitors", price: 0.01 },
  { name: "analyze_sentiment", price: 0.02 },
  { name: "compare_products", price: 0.05 },
]

function BalanceChecker() {
  const [address, setAddress] = useState("")
  const [balance, setBalance] = useState<{ usdc: string; xlm: string; funded: boolean; hasTrustline?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const check = async () => {
    if (!address.startsWith("G") || address.length !== 56) {
      setError("Enter a valid Stellar address (starts with G, 56 characters)")
      return
    }
    setLoading(true)
    setError("")
    setBalance(null)
    try {
      const resp = await fetch(`/api/stellar-balance?address=${address}`)
      const data = await resp.json()
      if (data.error) { setError(data.error); return }
      setBalance(data)
    } catch { setError("Failed to check balance") }
    finally { setLoading(false) }
  }

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
      <h3 className="text-white font-semibold mb-3">Check Wallet Balance</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="G... Stellar address"
          className="flex-1 px-3 py-2 rounded-lg bg-gray-950 border border-gray-700/50 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
        />
        <button
          onClick={check}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Check"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {balance && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">USDC Balance</span>
            <span className="text-white font-mono">${parseFloat(balance.usdc).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">XLM Balance</span>
            <span className="text-white font-mono">{parseFloat(balance.xlm).toFixed(2)} XLM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status</span>
            <span className={balance.funded ? "text-emerald-400" : "text-yellow-400"}>
              {balance.funded ? "Active" : "Not activated"}
            </span>
          </div>
          {parseFloat(balance.usdc) > 0 && (
            <div className="pt-2 border-t border-gray-800 text-sm text-gray-400">
              That&apos;s enough for {Math.floor(parseFloat(balance.usdc) / 0.01).toLocaleString()} search calls
              or {Math.floor(parseFloat(balance.usdc) / 0.05).toLocaleString()} compare calls
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FundPage() {
  const [amount, setAmount] = useState("5")

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Fund Your Agent Wallet
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl">
          Your Toll Proxy auto-creates a Stellar wallet. Fund it with USDC to start using paid MCP tools.
        </p>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {/* Step 1 */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">1</span>
              <h3 className="text-white font-semibold">Get Your Wallet Address</h3>
            </div>
            <p className="text-gray-400 text-sm mb-3 ml-11">
              Start the Toll Proxy — it will print your Stellar address:
            </p>
            <div className="ml-11 bg-gray-950 rounded-lg p-3 font-mono text-sm">
              <div className="text-gray-500">$</div>
              <div className="text-emerald-400">npx @rajkaria123/toll-proxy --target https://api.tollpay.xyz/mcp</div>
              <div className="text-gray-400 mt-1">  Wallet: GABCD...XYZ</div>
            </div>
            <p className="text-gray-500 text-xs mt-2 ml-11">
              Your wallet is saved at <code className="text-gray-400">~/.toll/wallet.json</code>
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">2</span>
              <h3 className="text-white font-semibold">Fund with USDC</h3>
            </div>
            <div className="ml-11 space-y-4">
              {/* LOBSTR */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">LOBSTR Wallet</p>
                  <p className="text-gray-400 text-sm">
                    Download LOBSTR (lobstr.co), buy USDC with credit card, send to your wallet address.
                    Easiest option — takes 2 minutes.
                  </p>
                </div>
              </div>
              {/* Exchange */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Exchange Route</p>
                  <p className="text-gray-400 text-sm">
                    Buy XLM on Coinbase or Binance, send to your Stellar wallet, swap to USDC on StellarX (stellarx.com).
                  </p>
                </div>
              </div>
              {/* MoneyGram */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">MoneyGram Access</p>
                  <p className="text-gray-400 text-sm">
                    Convert cash to USDC via the Stellar anchor network. Available in 180+ countries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">3</span>
              <h3 className="text-white font-semibold">Verify & Start Using Tools</h3>
            </div>
            <p className="text-gray-400 text-sm ml-11">
              Check your balance below, then connect to any Toll-powered MCP server.
              The proxy handles payments automatically from your wallet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Balance Checker */}
          <BalanceChecker />

          {/* Cost Calculator */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
            <h3 className="text-white font-semibold mb-3">How Far Does USDC Go?</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-700/50 text-sm text-white text-center focus:outline-none focus:border-emerald-500/50"
                min="0.01"
                step="1"
              />
              <span className="text-gray-400 text-sm">USDC buys you:</span>
            </div>
            <div className="space-y-2">
              {TOOL_PRICES.map((t) => (
                <div key={t.name} className="flex justify-between text-sm">
                  <span className="text-gray-400">{t.name.replace(/_/g, " ")}</span>
                  <span className="text-white font-mono">
                    {Math.floor(parseFloat(amount || "0") / t.price).toLocaleString()} calls
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Future */}
        <div className="mt-12 rounded-xl border border-dashed border-gray-700/50 bg-gray-900/20 p-6 text-center">
          <p className="text-gray-500 text-sm">
            Coming soon: Fund directly with a credit card via Stellar anchors.
          </p>
        </div>
      </div>
    </main>
  )
}
