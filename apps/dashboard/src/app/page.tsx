import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { ProtocolBadge } from "@/components/shared/ProtocolBadge"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET } from "@/lib/snippets"
import { TOOL_LISTINGS } from "@/lib/tools-registry"

const FEATURES = [
  {
    title: "HTTP 402 Native",
    desc: "Uses the web's built-in payment status code. Agents get a standard 402 response with payment requirements — no proprietary SDK needed.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Dual Protocol",
    desc: "x402 for one-off payments, MPP for high-frequency channels. Choose per tool or mix both protocols in one server.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Sub-Cent Pricing",
    desc: "Charge $0.001 per call. Stellar's negligible fees make true micropayments viable — no minimum transaction thresholds.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Analytics",
    desc: "Live dashboard with earnings charts, per-tool revenue, protocol split, top callers, and auto-refreshing transaction feed.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Free Tier Built In",
    desc: "Give agents N free calls before payment kicks in. Configurable per-tool rate limits with hourly or daily windows.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Zero Lock-In",
    desc: "One Express middleware. Your MCP server stays yours — Toll adds a payment layer without touching your tool implementations.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
]

const STEPS = [
  {
    num: "01",
    title: "Configure",
    desc: "Define tools, prices, and payment modes in a single JSON file. No contract deployment needed.",
    accent: "from-emerald-500/20 to-transparent",
  },
  {
    num: "02",
    title: "Wrap",
    desc: "Add one line of middleware before your MCP transport. Toll handles all payment verification.",
    accent: "from-blue-500/20 to-transparent",
  },
  {
    num: "03",
    title: "Earn",
    desc: "AI agents pay USDC on Stellar per call. Settlement is instant. Track everything in the dashboard.",
    accent: "from-purple-500/20 to-transparent",
  },
]

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 bg-grid">
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Built for Stellar Hacks 2026
            </span>
          </div>

          <h1 className="animate-fade-in delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            Monetize your<br />
            MCP server with<br />
            <span className="text-gradient">Stellar micropayments</span>
          </h1>

          <p className="animate-fade-in delay-200 text-base sm:text-lg text-gray-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            Toll is a payment gateway that lets AI agents pay for MCP tool calls
            using x402 and MPP on Stellar. Add monetization to any MCP server in minutes.
          </p>

          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Try the Live Demo
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5"
            >
              Read the Docs
            </Link>
          </div>

          {/* Trust signals */}
          <div className="animate-fade-in delay-500 flex items-center justify-center gap-6 mt-12 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              USDC on Stellar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              x402 Protocol
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              Machine Payments Protocol
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Three steps to monetization</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`animate-fade-in-slow delay-${(i + 1) * 200} rounded-2xl border border-white/5 bg-gradient-to-b ${step.accent} p-8 relative group hover:border-white/10 transition-all duration-300`}
              >
                <span className="text-6xl font-black text-white/5 absolute top-6 right-6 group-hover:text-white/10 transition-colors">{step.num}</span>
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stellar Testnet Proof */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Live on Stellar Testnet</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verified on-chain settlement</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Every paid tool call settles USDC on Stellar via the x402 facilitator. Transactions are verifiable on Stellar Expert. MPP payments use Soroban smart contract channels.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://stellar.expert/explorer/testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                >
                  Stellar Expert Explorer &rarr;
                </a>
                <a
                  href="https://laboratory.stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors"
                >
                  Stellar Laboratory
                </a>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-xs space-y-2 w-full md:w-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">Network</span>
                <span className="text-emerald-400">Stellar Testnet</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">Asset</span>
                <span className="text-gray-300">USDC (7 decimals)</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">x402</span>
                <span className="text-blue-400">Facilitator Settlement</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">MPP</span>
                <span className="text-purple-400">Soroban Channels</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-500">Tests</span>
                <span className="text-emerald-400">33 passing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Snippet */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Integration</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Add Toll in 10 lines</h2>
            <p className="text-sm text-gray-500 mt-3">Drop-in Express middleware. No SDK lock-in, no complex setup.</p>
          </div>
          <div className="glow-emerald rounded-2xl">
            <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Built for the agent economy</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`animate-fade-in delay-${(i % 3) * 100 + 100} rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Example tool pricing</h2>
            <p className="text-sm text-gray-500 mt-3">Configure per-tool pricing in USDC — from free to premium</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-left font-medium">Tool</th>
                  <th className="px-6 py-4 text-left font-medium">Protocol</th>
                  <th className="px-6 py-4 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {TOOL_LISTINGS.map((tool) => (
                  <tr key={tool.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-gray-200 font-medium">{tool.name}</span>
                      <span className="text-xs text-gray-600 block mt-0.5">{tool.category}</span>
                    </td>
                    <td className="px-6 py-4"><ProtocolBadge protocol={tool.protocol} /></td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold tabular-nums ${parseFloat(tool.price) === 0 ? "text-gray-500" : "text-emerald-400"}`}>
                        {parseFloat(tool.price) === 0 ? "Free" : `$${tool.price}`}
                      </span>
                      {parseFloat(tool.price) > 0 && <span className="text-xs text-gray-600 ml-1">USDC</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Start earning from your MCP tools
          </h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">
            Set up Toll on Stellar testnet in under 5 minutes.
            No contracts to deploy, no keys to manage.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Try the Demo
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
