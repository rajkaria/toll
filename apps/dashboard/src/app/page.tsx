import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { ProtocolBadge } from "@/components/shared/ProtocolBadge"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET } from "@/lib/snippets"
import { TOOL_LISTINGS } from "@/lib/tools-registry"

const FEATURES = [
  { title: "Two Payment Protocols", desc: "x402 (HTTP 402) and MPP (Machine Payments Protocol) — choose per tool or mix both.", icon: "~" },
  { title: "Real-Time Dashboard", desc: "Live earnings tracking with per-tool revenue, recent transactions, and protocol analytics.", icon: "#" },
  { title: "Zero Lock-In", desc: "Drop-in Express middleware. Your MCP server stays yours — Toll just adds a payment layer.", icon: ">" },
  { title: "Micropayments", desc: "Charge as little as $0.001 USDC per call. Stellar's low fees make sub-cent payments viable.", icon: "$" },
  { title: "Free Tier Support", desc: "Configure N free calls per hour/day before payment kicks in. Perfect for try-before-you-buy.", icon: "0" },
  { title: "Testnet Ready", desc: "Full testnet support with one-click wallet setup and Friendbot funding. Go live on mainnet when ready.", icon: "*" },
]

const STEPS = [
  { num: "01", title: "Configure", desc: "Define your tools, prices, and payment modes in a single JSON config file.", code: "toll.config.json" },
  { num: "02", title: "Wrap", desc: "Add tollMiddleware() to your Express server — one line before your MCP transport.", code: "tollMiddleware(config)" },
  { num: "03", title: "Earn", desc: "AI agents pay USDC on Stellar for each tool call. Track earnings in real time.", code: "USDC on Stellar" },
]

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="pt-24 pb-20 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
            Built for Stellar Hacks 2026
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
            Monetize your MCP server<br />
            <span className="text-emerald-400">with Stellar micropayments</span>
          </h1>
          <p className="text-lg text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            Toll is a payment gateway that lets AI agents pay for MCP tool calls
            using x402 and MPP on Stellar. Add monetization in minutes, not months.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              View Dashboard
            </Link>
            <Link
              href="/demo"
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 relative">
                <span className="text-5xl font-black text-gray-800 absolute top-4 right-4">{step.num}</span>
                <h3 className="text-lg font-bold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{step.desc}</p>
                <code className="text-xs text-emerald-400 bg-gray-800 px-2 py-1 rounded">{step.code}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Snippet */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-2">
            Add Toll in 10 Lines
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Drop-in Express middleware. No SDK lock-in, no complex setup.
          </p>
          <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-12">
            Why Toll
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
                <span className="text-2xl font-mono text-emerald-400 mb-3 block">{f.icon}</span>
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Example */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white tracking-tight text-center mb-2">
            Example Pricing
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            From free to premium — configure per-tool pricing in USDC
          </p>
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  <th className="px-6 py-3 text-left">Tool</th>
                  <th className="px-6 py-3 text-left">Protocol</th>
                  <th className="px-6 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {TOOL_LISTINGS.map((tool) => (
                  <tr key={tool.name} className="border-b border-gray-800/50">
                    <td className="px-6 py-3 text-gray-200 font-medium">{tool.name}</td>
                    <td className="px-6 py-3"><ProtocolBadge protocol={tool.protocol} /></td>
                    <td className="px-6 py-3 text-right text-emerald-400 tabular-nums font-medium">
                      {parseFloat(tool.price) === 0 ? "FREE" : `$${tool.price}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-4">
          Start earning from your MCP tools
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          Set up Toll on Stellar testnet in under 5 minutes
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/demo"
            className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Try the Demo
          </Link>
          <Link
            href="/docs"
            className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Read the Docs
          </Link>
        </div>
      </section>
    </main>
  )
}
