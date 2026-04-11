"use client"

import { useState } from "react"
import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { BEFORE_SNIPPET, AFTER_SNIPPET, TOLL_CONFIG_SNIPPET } from "@/lib/snippets"

/* ─── Live API Playground ─── */
function ApiPlayground() {
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free")
  const [response, setResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("AI agents")

  const callTool = async (tool: string) => {
    setLoading(true)
    setResponse(null)
    setStatus(null)
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: tool, arguments: tool === "health_check" ? {} : { query } },
        }),
      })
      setStatus(res.status)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch {
      setResponse("Network error — server may be restarting")
      setStatus(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setActiveTab("free"); setResponse(null); setStatus(null) }}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "free" ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400" : "text-gray-500 hover:text-gray-300"}`}
        >
          Free Tool &mdash; 200 OK
        </button>
        <button
          onClick={() => { setActiveTab("paid"); setResponse(null); setStatus(null) }}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "paid" ? "text-yellow-400 bg-yellow-500/10 border-b-2 border-yellow-400" : "text-gray-500 hover:text-gray-300"}`}
        >
          Paid Tool &mdash; 402 Payment Required
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">POST</span>
          <span className="text-xs font-mono text-gray-400">https://api.tollpay.xyz/mcp</span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {activeTab === "free"
            ? <>Calling <span className="text-emerald-400 font-mono">health_check</span> &mdash; no payment needed</>
            : <>Calling <span className="text-yellow-400 font-mono">search_competitors</span> &mdash; costs $0.01 USDC</>
          }
        </div>

        {activeTab === "paid" && (
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a search query..."
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300 placeholder-gray-600 focus:border-yellow-500/30 focus:outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
        )}

        <button
          onClick={() => callTool(activeTab === "free" ? "health_check" : "search_competitors")}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === "free"
              ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950"
              : "bg-yellow-500 hover:bg-yellow-400 text-gray-950"
          } ${loading ? "opacity-50 cursor-wait" : "hover:-translate-y-0.5"}`}
        >
          {loading ? "Calling..." : activeTab === "free" ? "Send Request" : "Send Request (see 402)"}
        </button>

        {response && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                status === 200 ? "bg-emerald-500/20 text-emerald-400" :
                status === 402 ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {status === 200 ? "200 OK" : status === 402 ? "402 Payment Required" : `Error ${status}`}
              </span>
              {status === 402 && (
                <span className="text-[10px] text-yellow-400/60">
                  An x402-compatible agent would auto-pay and retry here
                </span>
              )}
            </div>
            <pre className="rounded-xl bg-black/40 border border-white/5 p-4 text-[11px] text-gray-300 overflow-x-auto max-h-64 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {response}
            </pre>
            {status === 402 && (
              <p className="text-[10px] text-gray-600 mt-2">
                Real x402 response from Stellar mainnet &mdash; <span className="text-yellow-400">payTo</span>,{" "}
                <span className="text-yellow-400">asset</span>, and <span className="text-yellow-400">amount</span> are all production values.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Landing Page ─── */
export default function LandingPage() {
  return (
    <main className="overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-6 bg-grid">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live on Stellar Mainnet
            </span>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            The Stripe for<br /><span className="text-gradient">MCP Servers</span>
          </h1>
          <p className="animate-fade-in delay-200 text-base sm:text-lg text-gray-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            Thousands of MCP servers power AI agents today. None of them get paid.<br className="hidden sm:block" />
            Add Toll to yours &mdash; one middleware, one config &mdash; and every tool call earns USDC.
          </p>
          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="#quickstart" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              Get Started
            </Link>
            <Link href="#playground" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">
              See It Work
            </Link>
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest">What changes in your code</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Your server today</p>
              <CodeBlock code={BEFORE_SNIPPET} language="typescript" filename="server.ts" />
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium mb-2 uppercase tracking-wider">Your server with Toll</p>
              <CodeBlock code={AFTER_SNIPPET} language="typescript" filename="server.ts" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            One import. One middleware line. Your tools now charge USDC on every paid call.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Three things happen on every paid call</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                title: "Set your prices",
                desc: "One JSON config file. List each tool with a price in USDC. Free tools get price \"0\". That's the entire pricing setup.",
                accent: "border-emerald-500/20",
                numColor: "text-emerald-400 bg-emerald-500/10",
              },
              {
                num: "2",
                title: "Toll charges the agent",
                desc: "When an agent calls a paid tool, Toll returns HTTP 402 with the price. The agent's SDK auto-signs a USDC payment on Stellar and retries the request.",
                accent: "border-blue-500/20",
                numColor: "text-blue-400 bg-blue-500/10",
              },
              {
                num: "3",
                title: "USDC hits your wallet",
                desc: "Payment is verified on-chain via the OpenZeppelin facilitator. Your tool executes. Settlement takes 3-5 seconds. You see it on your dashboard.",
                accent: "border-purple-500/20",
                numColor: "text-purple-400 bg-purple-500/10",
              },
            ].map((step) => (
              <div key={step.num} className={`rounded-2xl border ${step.accent} bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all duration-300`}>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-5 ${step.numColor}`}>{step.num}</span>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Playground ── */}
      <section id="playground" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Live on Stellar Mainnet</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Try it. Right now.</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              This hits our live MCP server. Real Stellar mainnet. No setup required.
            </p>
          </div>
          <ApiPlayground />
          <p className="text-xs text-gray-500 mt-6 text-center max-w-lg mx-auto leading-relaxed">
            This is what your users experience. Free tools return 200. Paid tools return 402 with the price.
            An x402-compatible agent SDK handles payment and retries automatically.
          </p>

          {/* Compact tool pricing */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "health_check", price: "FREE", color: "text-emerald-400" },
              { name: "search_competitors", price: "$0.01", color: "text-white" },
              { name: "analyze_sentiment", price: "$0.02", color: "text-white" },
              { name: "compare_products", price: "$0.05", color: "text-white" },
            ].map((t) => (
              <div key={t.name} className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5 text-center">
                <p className="text-[10px] font-mono text-gray-500 truncate">{t.name}</p>
                <p className={`text-sm font-semibold ${t.color}`}>{t.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight">What you get</h2>
            <p className="text-sm text-gray-400 mt-3">Everything you need to charge for MCP tools. Nothing you don&apos;t.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: "Your code doesn't change",
                desc: "Toll is Express middleware. It wraps your MCP server without touching a single tool handler. Your logic stays yours.",
                border: "border-emerald-500/10",
              },
              {
                title: "Agents pay automatically",
                desc: "x402-compatible agents detect the 402, sign a USDC payment on Stellar, and retry. No invoicing. No manual billing. The protocol handles it.",
                border: "border-blue-500/10",
              },
              {
                title: "Every transaction is visible",
                desc: "Earnings dashboard shows revenue per tool, per caller, per day. Every payment links to its Stellar transaction. Nothing is hidden.",
                border: "border-purple-500/10",
              },
              {
                title: "Spending limits protect everyone",
                desc: "Per-call caps, daily budgets per caller, global daily limits. Rate limiting on free tiers. One bad actor can't drain your API.",
                border: "border-yellow-500/10",
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-xl border ${item.border} bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors`}>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section id="quickstart" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/3 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-3">Get started</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Three steps. Five minutes.</h2>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">1</span>
                <h3 className="text-sm font-semibold text-white">Install</h3>
              </div>
              <CodeBlock code="npm install @rajkaria123/toll-gateway @rajkaria123/toll-stellar" language="bash" filename="terminal" />
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">2</span>
                <h3 className="text-sm font-semibold text-white">Configure your tools and prices</h3>
              </div>
              <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">3</span>
                <h3 className="text-sm font-semibold text-white">Add one line of middleware</h3>
              </div>
              <CodeBlock
                code={`import { tollMiddleware, loadConfig } from "@rajkaria123/toll-gateway"\n\nconst config = loadConfig("./toll.config.json")\napp.use("/mcp", tollMiddleware(config))`}
                language="typescript"
                filename="server.ts"
              />
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-gray-400 mb-6">Deploy. Every paid tool call now earns USDC on Stellar.</p>
            <Link href="/docs" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Full documentation &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Stellar ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Why Stellar</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">$0.01 tool calls need $0.00001 fees</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Agent micropayments only work if the transaction cost is negligible. Stellar is the only production network where that&apos;s true.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-left font-medium"></th>
                  <th className="px-6 py-4 text-left font-medium text-emerald-400">Stellar</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-600">Ethereum</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-600">Solana</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["Finality", "3-5 seconds", "12+ seconds", "~0.4 seconds"],
                  ["Transaction fee", "~$0.00001", "$0.50 - $5.00", "~$0.00025"],
                  ["Native USDC", "First-class asset", "ERC-20 (bridge risk)", "SPL token"],
                  ["x402 protocol", "Production ready", "Limited", "Not available"],
                  ["MPP protocol", "Native support", "Not available", "Not available"],
                ].map(([req, stellar, eth, sol]) => (
                  <tr key={req} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3.5 text-gray-400 font-medium">{req}</td>
                    <td className="px-6 py-3.5 text-emerald-400 font-medium">{stellar}</td>
                    <td className="px-6 py-3.5 text-gray-600">{eth}</td>
                    <td className="px-6 py-3.5 text-gray-600">{sol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 mt-3 px-6">
            Sources: Stellar finality and fees per{" "}
            <a href="https://developers.stellar.org" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 underline">developers.stellar.org</a>.
            Ethereum finality per{" "}
            <a href="https://ethereum.org/en/developers/docs/consensus-mechanisms" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 underline">ethereum.org</a>.
            Solana finality per{" "}
            <a href="https://solana.com/docs" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 underline">solana.com</a>.
            USDC issuer data per{" "}
            <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-400 underline">circle.com</a>.
          </p>
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-emerald-400 font-semibold">You never touch Stellar directly.</span>{" "}
              Toll abstracts all blockchain internals. You don&apos;t configure wallets, sign transactions, or learn Soroban.
              You set prices in your config file. Toll and Stellar handle the rest.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Your tools are already useful.<br />Now they can earn money.
          </h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">
            npm install, add your config, deploy. That&apos;s the entire integration.
          </p>
          <Link href="/docs" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-10 py-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            Read the Docs &amp; Start Earning
          </Link>
        </div>
      </section>

    </main>
  )
}
