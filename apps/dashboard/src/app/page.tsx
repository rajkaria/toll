import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { HERO_SNIPPET, CONNECT_SNIPPET } from "@/lib/snippets"

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
            <Link href="#try-it" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
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

      {/* Earnings Mock */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">Your earnings</p>
                <p className="text-3xl font-bold text-white">$47.20</p>
                <p className="text-sm text-gray-400 mt-1">earned this week across 3 MCP servers</p>
              </div>
              <a href="https://stellar.expert/explorer/public" target="_blank" rel="noopener noreferrer" className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25">
                Withdraw to Wallet
              </a>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">Today</p>
                <p className="text-lg font-semibold text-white">$8.40</p>
                <p className="text-xs text-emerald-400">168 calls</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">Avg per call</p>
                <p className="text-lg font-semibold text-white">$0.03</p>
                <p className="text-xs text-gray-400">USDC on Stellar</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-1">Top tool</p>
                <p className="text-lg font-semibold text-white">analyze</p>
                <p className="text-xs text-gray-400">$0.02 / call</p>
              </div>
            </div>
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

      {/* Try It Yourself */}
      <section id="try-it" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Live on mainnet</p>
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

            {/* Live Proof */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Recent mainnet transactions</p>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                {[
                  { tool: "search_competitors", amount: "$0.01", time: "2 min ago", hash: "abc...def" },
                  { tool: "analyze_sentiment", amount: "$0.02", time: "5 min ago", hash: "123...456" },
                  { tool: "compare_products", amount: "$0.05", time: "12 min ago", hash: "789...abc" },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm text-gray-200 font-medium">{tx.tool}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-emerald-400 font-semibold tabular-nums">{tx.amount}</span>
                      <span className="text-xs text-gray-600">{tx.time}</span>
                      <a href={`https://stellar.expert/explorer/public/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        tx &rarr;
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Every payment is a real Stellar mainnet transaction.{" "}
                <a href="https://stellar.expert/explorer/public" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Verify on Stellar Expert &rarr;
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">You built an MCP server.<br />Now get paid for it.</h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">
            npm install @toll/gateway. Three lines. Mainnet USDC.
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
