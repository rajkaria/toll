import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-gray-950 font-bold text-xs">
                T
              </div>
              <span className="text-white font-semibold tracking-tight">Tollpay</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              The payment gateway for MCP servers. Charge AI agents for tool usage with Stellar micropayments.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Product</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
              <Link href="/demo" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Live Demo</Link>
              <Link href="/tools" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Available Tools</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Resources</p>
            <div className="flex flex-col gap-2">
              <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Documentation</Link>
              <Link href="/protocols" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Protocols</Link>
              <Link href="/docs#api-reference" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">API Reference</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-600">
            Built on Stellar &middot; Stellar Hacks 2026
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>x402 + MPP</span>
            <span>&middot;</span>
            <span>USDC Micropayments</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
