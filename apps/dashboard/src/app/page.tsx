"use client"

import { useState } from "react"
import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { BEFORE_SNIPPET, AFTER_SNIPPET, TOLL_CONFIG_SNIPPET, PROXY_SNIPPET, PROXY_CONFIG_SNIPPET, REGISTRY_SNIPPET } from "@/lib/snippets"

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

/* ─── Revenue Calculator ─── */
function RevenueCalculator() {
  const [callsPerDay, setCallsPerDay] = useState(1000)
  const [pricePerCall, setPricePerCall] = useState(0.01)

  const daily = callsPerDay * pricePerCall
  const monthly = daily * 30
  const yearly = daily * 365

  const formatMoney = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
    return `$${n.toFixed(n < 1 ? 2 : 0)}`
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 mb-10">
      <h3 className="text-center text-sm font-semibold text-white mb-2">Revenue Calculator</h3>
      <p className="text-center text-xs text-gray-500 mb-8">Drag the sliders. See what your tools could earn.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Calls per day slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-gray-400">Tool calls per day</label>
            <span className="text-sm font-bold text-white">{callsPerDay.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={10}
            max={50000}
            step={10}
            value={callsPerDay}
            onChange={(e) => setCallsPerDay(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-800 accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>10</span>
            <span>50,000</span>
          </div>
        </div>

        {/* Price per call slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-gray-400">Price per call (USDC)</label>
            <span className="text-sm font-bold text-white">${pricePerCall.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.001}
            max={1}
            step={0.001}
            value={pricePerCall}
            onChange={(e) => setPricePerCall(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-800 accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>$0.001</span>
            <span>$1.00</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-black/20">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Daily</p>
          <p className="text-xl font-bold text-white">{formatMoney(daily)}</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-black/20 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Monthly</p>
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(monthly)}</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-black/20">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Yearly</p>
          <p className="text-xl font-bold text-white">{formatMoney(yearly)}</p>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-600 mt-4">100% goes to you. No Toll fee. No middleman. Paid instantly in USDC.</p>
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
            Get paid every time AI uses your tools.<br className="hidden sm:block" />
            One line of code. Instant USDC payments. No invoices, no subscriptions &mdash; just revenue.
          </p>
          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="#quickstart" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              Start Earning
            </Link>
            <Link href="#playground" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">
              See It Work
            </Link>
          </div>

          {/* Who is this for */}
          <div className="animate-fade-in delay-300 mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> I build AI tools &mdash; <Link href="#quickstart" className="text-emerald-400 hover:underline">monetize them</Link></span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> I use AI agents &mdash; <Link href="#proxy" className="text-blue-400 hover:underline">access paid tools</Link></span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> I&apos;m exploring &mdash; <Link href="#value" className="text-purple-400 hover:underline">show me the value</Link></span>
          </div>
        </div>
      </section>

      {/* ── Social proof / stats bar ── */}
      <section className="py-6 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
          <div>
            <p className="text-lg font-bold text-white">18</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tools in Registry</p>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-lg font-bold text-white">5</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Live Servers</p>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-lg font-bold text-emerald-400">$0.00001</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Per Transaction Fee</p>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <p className="text-lg font-bold text-white">3 sec</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Settlement</p>
          </div>
        </div>
      </section>

      {/* ── Without Toll — Value Left on the Table ── */}
      <section id="value" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-red-400 font-medium uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Without Toll, you&apos;re leaving money on the table
            </h2>
            <p className="text-gray-400 text-sm mt-4 max-w-2xl mx-auto">
              AI agents make thousands of tool calls every day. Each call uses your compute, your API keys, your data.
              You pay for all of it. They pay nothing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Without Toll */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-red-400 text-lg">✗</span>
                <h3 className="text-lg font-bold text-red-400">Without Toll</h3>
              </div>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>You host tools &mdash; <span className="text-white font-medium">you pay the server bill</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Agents call your tools 10,000 times/day &mdash; <span className="text-white font-medium">$0 revenue</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>No budget limits &mdash; <span className="text-white font-medium">one bad actor drains your API</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>No usage data &mdash; <span className="text-white font-medium">you don&apos;t know who uses what</span></span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-red-500/10">
                <p className="text-xs text-gray-600">Example: 10K calls/day × $0.01 cost each = <span className="text-red-400 font-bold">-$100/day from your pocket</span></p>
              </div>
            </div>

            {/* With Toll */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-emerald-400 text-lg">✓</span>
                <h3 className="text-lg font-bold text-emerald-400">With Toll</h3>
              </div>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Set a price per tool call &mdash; <span className="text-white font-medium">$0.01 to $1.00, you decide</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Same 10,000 calls/day &mdash; <span className="text-emerald-400 font-medium">$100/day in USDC to your wallet</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Budget limits built in &mdash; <span className="text-white font-medium">automatic rate limiting per caller</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>Full dashboard &mdash; <span className="text-white font-medium">revenue per tool, per caller, per day</span></span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-emerald-500/10">
                <p className="text-xs text-gray-600">Same 10K calls/day × $0.01 each = <span className="text-emerald-400 font-bold">+$100/day into your wallet</span></p>
              </div>
            </div>
          </div>

          {/* Interactive Revenue Calculator */}
          <RevenueCalculator />

          {/* Key value props for everyone */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">5 min</p>
              <p className="text-gray-500 text-xs">to set up</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400 mb-1">3 sec</p>
              <p className="text-gray-500 text-xs">payment settlement</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">$0.00001</p>
              <p className="text-gray-500 text-xs">transaction fee</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">USDC</p>
              <p className="text-gray-500 text-xs">real dollars, not tokens</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">For developers</p>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">One line of code. That&apos;s the change.</h2>
            <p className="text-xs text-gray-500">Your existing server stays the same. Toll adds a payment layer on top.</p>
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
            <h2 className="text-3xl font-bold text-white tracking-tight">Simple as setting a price tag</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Think of it like a vending machine for AI. You stock the tools, set the prices. AI agents insert coins (USDC) and get access.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "1",
                title: "You set a price",
                desc: "\"Search costs $0.01. Analysis costs $0.05.\" That's it. You pick the price for each tool you offer. Free tools stay free.",
                accent: "border-emerald-500/20",
                numColor: "text-emerald-400 bg-emerald-500/10",
              },
              {
                num: "2",
                title: "AI agent pays instantly",
                desc: "When an AI tries to use your tool, Toll says \"that'll be $0.01.\" The agent pays in USDC (a digital dollar) automatically — no invoices, no subscriptions.",
                accent: "border-blue-500/20",
                numColor: "text-blue-400 bg-blue-500/10",
              },
              {
                num: "3",
                title: "Money lands in your wallet",
                desc: "Payment arrives in 3 seconds. Not 30 days. Not \"net 60.\" Real USDC in your wallet, visible on your dashboard. Cash out anytime.",
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
            <p className="text-sm text-gray-400 mt-3">Everything you need to turn free tools into a revenue stream.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: "5-minute setup, zero rewrites",
                desc: "Add one line to your existing server. Your tools, your logic — nothing changes. Toll just adds a price tag and collects payment.",
                border: "border-emerald-500/10",
              },
              {
                title: "AI agents pay automatically",
                desc: "No invoices. No subscriptions. No billing portal. When an AI uses your tool, it pays you instantly. The payment happens in the background — like a toll booth on a highway.",
                border: "border-blue-500/10",
              },
              {
                title: "See every dollar earned",
                desc: "Real-time dashboard shows who paid, how much, and for what. Every payment is traceable on-chain. Full transparency, no black boxes.",
                border: "border-purple-500/10",
              },
              {
                title: "Built-in protection",
                desc: "Budget limits per caller, per day. If an AI goes haywire and spams your tool — it gets cut off automatically. You stay protected.",
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

      {/* ── The Platform ── */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">The Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Not just payments.<br />Discovery, proxy, and quality — built in.
            </h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              Toll is a complete platform for the agent economy. Developers monetize tools, agents discover and pay for them,
              and quality scores ensure the best tools rise to the top.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link href="/registry" className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 hover:bg-emerald-500/10 transition-all duration-300">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Tool Registry</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Agents discover tools by capability and price. Register your server with one command.
                Quality scores rank the best tools.
              </p>
              <span className="text-xs text-emerald-400 font-medium">Browse the Registry &rarr;</span>
            </Link>
            <Link href="/fund" className="group rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 hover:bg-blue-500/10 transition-all duration-300">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Toll Proxy</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Any MCP client can use paid tools — zero code changes. The proxy auto-creates a wallet,
                signs USDC payments, and enforces budget limits.
              </p>
              <span className="text-xs text-blue-400 font-medium">Set up your wallet &rarr;</span>
            </Link>
            <Link href="/why-toll" className="group rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 hover:bg-purple-500/10 transition-all duration-300">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Why Toll?</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                The payment infrastructure the agent economy needs. 3-second settlement, $0.00001 fees,
                and a developer experience that takes 5 minutes.
              </p>
              <span className="text-xs text-purple-400 font-medium">Learn more &rarr;</span>
            </Link>
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

      {/* ── Toll Proxy — Zero-Config Payments ── */}
      <section id="proxy" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">For AI Agents</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Use paid tools without writing payment code
          </h2>
          <p className="text-gray-500 text-sm mb-10 max-w-2xl">
            The Toll Proxy sits between your MCP client and any Toll-powered server.
            It intercepts 402 responses, signs USDC payments, and retries — all transparently.
            Use our hosted proxy at <code className="text-emerald-400 text-xs">proxy.tollpay.xyz</code> or self-host with npx.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-2">Start the proxy:</p>
              <CodeBlock code={PROXY_SNIPPET} language="bash" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-2">Connect your MCP client:</p>
              <CodeBlock code={PROXY_CONFIG_SNIPPET} language="json" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">0</p>
              <p className="text-gray-500 text-xs">lines of payment code</p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400 mb-1">Auto</p>
              <p className="text-gray-500 text-xs">wallet creation &amp; funding</p>
            </div>
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-white mb-1">$5/day</p>
              <p className="text-gray-500 text-xs">default budget limit</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tool Registry ── */}
      <section id="registry" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Discovery</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            The directory for paid AI tools
          </h2>
          <p className="text-gray-500 text-sm mb-10 max-w-2xl">
            Agents discover tools by capability and price. Developers register their servers with one command.
            Quality scores help agents choose the best tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-xs font-medium mb-2">Discover tools programmatically:</p>
              <CodeBlock code={REGISTRY_SNIPPET} language="typescript" />
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
                <p className="text-white font-semibold text-sm mb-1">For Server Developers</p>
                <p className="text-gray-400 text-xs mb-3">Register your tools and let agents find you:</p>
                <code className="text-emerald-400 text-xs font-mono">npx @rajkaria123/toll-cli register --url https://your-server.com/mcp</code>
              </div>
              <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
                <p className="text-white font-semibold text-sm mb-1">For Agent Developers</p>
                <p className="text-gray-400 text-xs mb-3">Browse available tools with quality scores and connect instantly.</p>
                <Link href="/registry" className="text-emerald-400 text-xs hover:underline">Browse the Registry &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Every tool call that doesn&apos;t pay you<br />is money you&apos;re giving away.
          </h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">
            Set up takes 5 minutes. Your first payment arrives in seconds.
          </p>
          <Link href="/docs" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-10 py-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            Start Earning Now
          </Link>
        </div>
      </section>

    </main>
  )
}
