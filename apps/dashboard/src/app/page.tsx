"use client"

import { useState } from "react"
import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { HERO_SNIPPET, CONNECT_SNIPPET } from "@/lib/snippets"

function ApiPlayground() {
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free")
  const [response, setResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

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
          params: { name: tool, arguments: tool === "health_check" ? {} : { query: "AI agents" } },
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
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setActiveTab("free"); setResponse(null); setStatus(null) }}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "free" ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400" : "text-gray-500 hover:text-gray-300"}`}
        >
          Free Tool (200 OK)
        </button>
        <button
          onClick={() => { setActiveTab("paid"); setResponse(null); setStatus(null) }}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${activeTab === "paid" ? "text-yellow-400 bg-yellow-500/10 border-b-2 border-yellow-400" : "text-gray-500 hover:text-gray-300"}`}
        >
          Paid Tool (402 Payment Required)
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">POST</span>
          <span className="text-xs font-mono text-gray-400">https://api.tollpay.xyz/mcp</span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {activeTab === "free"
            ? <>Calling <span className="text-emerald-400 font-mono">health_check</span> — no payment needed</>
            : <>Calling <span className="text-yellow-400 font-mono">search_competitors</span> — requires $0.01 USDC</>
          }
        </div>

        <button
          onClick={() => callTool(activeTab === "free" ? "health_check" : "search_competitors")}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === "free"
              ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950"
              : "bg-yellow-500 hover:bg-yellow-400 text-gray-950"
          } ${loading ? "opacity-50 cursor-wait" : "hover:-translate-y-0.5"}`}
        >
          {loading ? "Calling..." : activeTab === "free" ? "Call Free Tool" : "Call Paid Tool (see 402)"}
        </button>

        {/* Response */}
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
                  Agent would auto-pay $0.01 USDC on Stellar here
                </span>
              )}
            </div>
            <pre className="rounded-xl bg-black/40 border border-white/5 p-4 text-[11px] text-gray-300 overflow-x-auto max-h-64 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {response}
            </pre>
            {status === 402 && (
              <p className="text-[10px] text-gray-600 mt-2">
                This is a real x402 v2 response from Stellar mainnet. The <span className="text-yellow-400">payTo</span> address,{" "}
                <span className="text-yellow-400">asset</span> contract, and <span className="text-yellow-400">amount</span> (in stroops) are all production values.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
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
            The Stripe for<br /><span className="text-gradient">MCP servers</span>
          </h1>
          <p className="animate-fade-in delay-200 text-base sm:text-lg text-gray-400 mt-8 max-w-xl mx-auto leading-relaxed">
            Three lines of code. Your MCP server has a paywall.<br />
            USDC settles on Stellar. You get paid.
          </p>
          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="#playground" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              Try It Live
            </Link>
            <Link href="/docs" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Install + Code */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-fade-in delay-500">
            <CodeBlock code={HERO_SNIPPET} language="typescript" filename="server.ts" />
          </div>
        </div>
      </section>

      {/* Live API Playground */}
      <section id="playground" className="py-16 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Live API Playground</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">See it work — right now</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Hit our live MCP server on Stellar mainnet. No setup, no wallet, no install.
              See a real HTTP 200 and a real HTTP 402 with Stellar payment requirements.
            </p>
          </div>
          <ApiPlayground />
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <div className="mb-6">
              <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">Watchdog Lite — Live demo</p>
              <p className="text-lg font-semibold text-white mt-2">Real MCP server, real Stellar payments</p>
              <p className="text-sm text-gray-400 mt-1">Connect any MCP client to <span className="text-emerald-400 font-mono text-xs">api.tollpay.xyz/mcp</span></p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">health_check</p>
                <p className="text-lg font-semibold text-emerald-400">FREE</p>
                <p className="text-xs text-gray-400">Server status</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">search_competitors</p>
                <p className="text-lg font-semibold text-white">$0.01</p>
                <p className="text-xs text-gray-400">USDC via x402</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">analyze_sentiment</p>
                <p className="text-lg font-semibold text-white">$0.02</p>
                <p className="text-xs text-gray-400">USDC via x402</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">compare_products</p>
                <p className="text-lg font-semibold text-white">$0.05</p>
                <p className="text-xs text-gray-400">USDC via MPP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Stellar */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Why Stellar</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">The only chain built for micropayments</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Agent tool calls cost fractions of a cent. Only one network makes that economically viable.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-left font-medium">Requirement</th>
                  <th className="px-6 py-4 text-left font-medium">Stellar</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-600">Ethereum</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-600">Solana</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["Finality", "3-5 seconds", "12+ seconds", "~0.4 seconds"],
                  ["Tx Fee", "~$0.00001", "~$0.50-$5.00", "~$0.00025"],
                  ["Native USDC", "First-class asset", "ERC-20 (bridge risk)", "SPL token"],
                  ["x402 Support", "Production ready", "Limited", "Not available"],
                  ["MPP Support", "Native protocol", "Not available", "Not available"],
                ].map(([req, stellar, eth, sol]) => (
                  <tr key={req} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3.5 text-gray-300 font-medium">{req}</td>
                    <td className="px-6 py-3.5 text-emerald-400 font-medium">{stellar}</td>
                    <td className="px-6 py-3.5 text-gray-600">{eth}</td>
                    <td className="px-6 py-3.5 text-gray-600">{sol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-emerald-400 font-semibold">Zero blockchain complexity.</span>{" "}
              Toll abstracts all Stellar internals. You never configure wallets, sign transactions, or understand consensus.
              Build your MCP server however you want — the monetary layer is Stellar, the developer experience is Toll.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works — Toll Booth */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">The toll booth for API calls</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                icon: "\u{1F6E3}",
                title: "Agent arrives",
                desc: "An AI agent calls your MCP tool. Toll intercepts the request and checks if the tool has a price.",
                accent: "from-emerald-500/20 to-transparent",
              },
              {
                num: "02",
                icon: "\u{1F6A7}",
                title: "Paywall gates",
                desc: "Toll returns HTTP 402 with the price. The agent's SDK auto-signs a USDC payment on Stellar and retries.",
                accent: "from-blue-500/20 to-transparent",
              },
              {
                num: "03",
                icon: "\u{1F4B0}",
                title: "USDC settles",
                desc: "Payment is verified on-chain. The tool executes. You see the transaction on your dashboard with a Stellar explorer link.",
                accent: "from-purple-500/20 to-transparent",
              },
            ].map((step) => (
              <div key={step.num} className={`rounded-2xl border border-white/5 bg-gradient-to-b ${step.accent} p-8 relative group hover:border-white/10 transition-all duration-300`}>
                <span className="text-6xl font-black text-white/5 absolute top-6 right-6 group-hover:text-white/10 transition-colors">{step.num}</span>
                <div className="relative">
                  <span className="text-3xl mb-3 block">{step.icon}</span>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Every Builder */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/3 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-3">For every MCP builder</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Add payments to your project in 5 minutes</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Building an MCP server for a hackathon or production? Toll handles the payment layer
              so you can focus on your tools. Works with any framework, any language, any MCP server.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Keep your existing code",
                desc: "Toll is middleware. It wraps your MCP server without modifying a single tool handler. Your logic stays yours.",
                icon: "\u{1F4E6}",
              },
              {
                title: "No Stellar knowledge needed",
                desc: "You don't configure wallets, sign transactions, or understand Soroban. npm install, add config, deploy. Done.",
                icon: "\u{2728}",
              },
              {
                title: "Free and paid tools together",
                desc: "Set price: \"0\" for free tools, any amount for paid ones. Rate-limit free tiers. Mix protocols per tool.",
                icon: "\u{1F3AF}",
              },
              {
                title: "Production-ready security",
                desc: "Replay protection, spending policies, input validation, facilitator-verified settlement. Not a demo — infrastructure.",
                icon: "\u{1F512}",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition-all duration-300">
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-3">Quick install</p>
            <div className="font-mono text-sm text-gray-300 space-y-2">
              <p><span className="text-gray-600">$</span> npm install @rajkaria123/toll-gateway @rajkaria123/toll-stellar</p>
              <p><span className="text-gray-600">$</span> cp node_modules/@rajkaria123/toll-gateway/toll.config.example.json toll.config.json</p>
              <p><span className="text-gray-600">$</span> <span className="text-gray-500"># edit toll.config.json with your tools and prices</span></p>
              <p><span className="text-gray-600">$</span> <span className="text-gray-500"># add 1 line of middleware to your server</span></p>
              <p><span className="text-gray-600">$</span> node server.js <span className="text-emerald-400"># earning USDC on Stellar</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Yourself — MCP Config */}
      <section id="try-it" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Connect your client</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Try it yourself</h2>
            <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
              Watchdog is a real MCP server running behind Toll on Stellar mainnet.
              Call the free health_check tool, or pay USDC to use the paid tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MCP Client Config */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Connect your MCP client</p>
              <CodeBlock code={CONNECT_SNIPPET} language="json" filename="claude_desktop_config.json" />
              <p className="text-xs text-gray-500 mt-3">
                Paste this into Claude Desktop, Cursor, or any MCP client.
                The <span className="text-emerald-400">health_check</span> tool is free.
                Paid tools require a funded Stellar wallet with USDC.
              </p>
            </div>

            {/* What happens */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">What happens when you call a paid tool</p>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                {[
                  { num: "1", color: "emerald", label: "Agent calls", mono: "search_competitors", sub: "Standard MCP JSON-RPC request" },
                  { num: "2", color: "yellow", label: "Toll returns", mono: "HTTP 402", sub: "x402 v2 spec: 0.01 USDC, Stellar pubnet, payTo address" },
                  { num: "3", color: "blue", label: "SDK signs USDC payment on Stellar", mono: "", sub: "Auto-retry with payment-signature header" },
                  { num: "4", color: "emerald", label: "Payment verified, tool executes", mono: "", sub: "Settlement via OpenZeppelin x402 facilitator" },
                ].map((s) => (
                  <div key={s.num} className="flex items-start gap-3">
                    <span className={`shrink-0 w-6 h-6 rounded-full bg-${s.color}-500/20 text-${s.color}-400 text-xs font-bold flex items-center justify-center mt-0.5`}>{s.num}</span>
                    <div>
                      <p className="text-sm text-gray-200 font-medium">{s.label}{s.mono && <> <span className={`font-mono text-${s.color}-400`}>{s.mono}</span></>}</p>
                      <p className="text-xs text-gray-500">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Every payment settles as a real Stellar mainnet transaction.{" "}
                <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
                  View earnings dashboard &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built On */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-8">Built on</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { name: "Stellar", sub: "USDC Settlement" },
              { name: "x402", sub: "Payment Protocol" },
              { name: "MPP", sub: "Machine Payments" },
              { name: "MCP", sub: "Tool Protocol" },
              { name: "OpenZeppelin", sub: "Facilitator" },
            ].map((tech) => (
              <div key={tech.name} className="text-center group">
                <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">{tech.name}</p>
                <p className="text-[10px] text-gray-600">{tech.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">You built an MCP server.<br />Now get paid for it.</h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">
            npm install @rajkaria123/toll-gateway. Three lines. Mainnet USDC.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">Get Started</Link>
            <Link href="/dashboard" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">View Dashboard</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
