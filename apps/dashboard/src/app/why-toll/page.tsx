import Link from "next/link"

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 hover:border-gray-600/50 transition-colors">
      <span className="text-2xl mb-3 block">{icon}</span>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{children}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-bold text-emerald-400">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function WhyTollPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-20">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-4">Why Toll</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            The payment infrastructure<br />the agent economy needs
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            10,000+ MCP servers power AI agents today. None of them have a way to charge.
            Toll fixes that with one npm package, three lines of config, and USDC settlement on Stellar.
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8 text-center">The problem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="text-white font-semibold mb-2">MCP servers are free by default</h3>
              <p className="text-sm text-gray-400">
                Developers build powerful AI tools — research, analysis, code generation — and give them away.
                There is no payment layer in the MCP protocol.
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="text-white font-semibold mb-2">Agents can&apos;t pay even if they want to</h3>
              <p className="text-sm text-gray-400">
                MCP clients like Claude Desktop and Cursor don&apos;t have wallets.
                Even if a server charges, agents have no way to sign a payment and retry.
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="text-white font-semibold mb-2">Agents can&apos;t discover tools</h3>
              <p className="text-sm text-gray-400">
                There is no directory of paid MCP tools. An agent that needs a capability has no way
                to search for a server that offers it, compare prices, or check quality.
              </p>
            </div>
          </div>
        </section>

        {/* The Toll Platform */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3 text-center">Toll solves all three</h2>
          <p className="text-gray-500 text-sm text-center mb-10 max-w-xl mx-auto">
            A complete platform: payment middleware for developers, a proxy for agents, and a registry for discovery.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card icon="💰" title="Monetize in 5 minutes">
              npm install, add a config file with prices, deploy. Toll middleware intercepts paid tool calls,
              returns HTTP 402, and verifies USDC payments on Stellar. Your tool code never changes.
            </Card>
            <Card icon="🤖" title="Agents pay automatically">
              The Toll Proxy sits between any MCP client and your server. It auto-creates a Stellar wallet,
              signs payments, and retries — so Claude Desktop and Cursor can use paid tools today without code changes.
            </Card>
            <Card icon="🔍" title="Discovery built in">
              Register your server with one CLI command. Agents discover your tools through the Toll Registry API
              by capability, price, and quality score. No marketing needed — agents find you programmatically.
            </Card>
            <Card icon="📊" title="Quality scores rank the best">
              Every tool call through the proxy is measured: latency, success rate, uptime.
              Quality scores help agents choose the best tools, and reward developers who ship reliable services.
            </Card>
            <Card icon="⚡" title="3-second settlement on Stellar">
              Payments settle in USDC on Stellar mainnet. Sub-second finality means the agent doesn&apos;t wait.
              Near-zero fees ($0.00001) mean $0.01 tool calls are profitable. No other chain can do both.
            </Card>
            <Card icon="🛡️" title="Budget controls protect everyone">
              Per-call limits, daily budgets, caller allowlists, replay protection, rate limiting.
              Developers set spending policies. Agents set budget caps. Nobody gets surprised.
            </Card>
          </div>
        </section>

        {/* Numbers */}
        <section className="mb-20 rounded-2xl border border-gray-700/50 bg-gray-900/30 p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="3s" label="Payment settlement" />
            <Stat value="$0.00001" label="Transaction fee" />
            <Stat value="5 min" label="Integration time" />
            <Stat value="3" label="Lines of code" />
          </div>
        </section>

        {/* Who is Toll for */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8 text-center">Who is Toll for?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="text-emerald-400 font-semibold text-lg mb-3">MCP Server Developers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#10003;</span> Turn any MCP tool into a revenue stream</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#10003;</span> Set per-tool pricing in USDC</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#10003;</span> Get discovered by agents through the Registry</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#10003;</span> Track earnings in real-time on the Dashboard</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#10003;</span> Zero blockchain knowledge needed</li>
              </ul>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
              <h3 className="text-blue-400 font-semibold text-lg mb-3">AI Agent Developers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#10003;</span> Discover paid tools by capability and price</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#10003;</span> Auto-pay with the Toll Proxy (zero code changes)</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#10003;</span> Budget controls prevent overspending</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#10003;</span> Quality scores help choose the best tools</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#10003;</span> Works with Claude Desktop, Cursor, and any MCP client</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works flow */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8 text-center">How the payment flow works</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { step: "1", title: "Agent calls a paid tool", desc: "POST /mcp with a tools/call JSON-RPC request" },
              { step: "2", title: "Toll returns HTTP 402", desc: "Response includes price, Stellar address, USDC asset, and facilitator URL" },
              { step: "3", title: "Agent signs USDC payment", desc: "The SDK (or Proxy) creates an x402 payment signature using the agent's Stellar keypair" },
              { step: "4", title: "Agent retries with payment", desc: "Same request, now with the payment-signature header attached" },
              { step: "5", title: "Facilitator verifies on-chain", desc: "OpenZeppelin confirms the USDC transfer settled on Stellar mainnet" },
              { step: "6", title: "Tool executes, result returned", desc: "The developer earns USDC. The agent gets its data. Total time: 3-5 seconds." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 rounded-lg border border-gray-700/30 bg-gray-900/30 p-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold shrink-0">{s.step}</span>
                <div>
                  <p className="text-white font-medium text-sm">{s.title}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8 text-center">What can you monetize?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Research tools", desc: "Competitive intelligence, market research, academic search", price: "$0.01-0.10" },
              { title: "Data analysis", desc: "Sentiment analysis, trend detection, financial metrics", price: "$0.02-0.50" },
              { title: "Content generation", desc: "Copy, summaries, translations, documentation", price: "$0.05-1.00" },
              { title: "Code tools", desc: "Code review, test generation, security scanning", price: "$0.10-2.00" },
              { title: "API wrappers", desc: "Weather, maps, payments, social media APIs", price: "$0.001-0.05" },
              { title: "Specialized knowledge", desc: "Legal research, medical databases, patent search", price: "$0.50-5.00" },
            ].map((uc) => (
              <div key={uc.title} className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-white font-medium text-sm">{uc.title}</h4>
                  <span className="text-emerald-400 text-xs font-mono whitespace-nowrap">{uc.price}</span>
                </div>
                <p className="text-gray-500 text-xs">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-4">Start earning from your MCP tools</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
            Three lines of config. Five minutes to deploy. Real USDC payments on Stellar mainnet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25">
              Read the Docs
            </Link>
            <Link href="/registry" className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm">
              Browse the Registry
            </Link>
          </div>
        </section>

      </div>
    </main>
  )
}
