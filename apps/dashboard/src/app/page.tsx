import Link from "next/link"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { ProtocolBadge } from "@/components/shared/ProtocolBadge"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET, SDK_SNIPPET, CLI_SNIPPET } from "@/lib/snippets"
import { TOOL_LISTINGS } from "@/lib/tools-registry"

const PRIMITIVES = [
  { name: "PaymentGate", desc: "Express middleware — x402 + MPP dual-protocol gating with replay protection, 402 rate limiting, and input sanitization.", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  { name: "SpendingPolicy", desc: "Budget caps, daily limits, caller allowlists, per-call maximums. The trust primitive for safe autonomous agent payments.", color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
  { name: "EarningsLedger", desc: "SQLite tracking with idempotent recording, tamper-evident audit log (SHA-256 hash chain), and cohort analytics.", color: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5" },
  { name: "ProtocolBridge", desc: "x402 for per-call with facilitator settlement, MPP for session-based payment channels, Soroban escrow for high-value calls.", color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
  { name: "ConfigDSL", desc: "Declarative JSON for tools, prices, tiers, A/B tests, sessions, spending policies, webhooks, and API keys. No code changes.", color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
]

const FEATURES = [
  { title: "Dual Protocol (x402 + MPP)", desc: "Per-call x402 with on-chain settlement and session-based MPP payment channels. Choose per tool.", icon: "svg-exchange" },
  { title: "Agent SDK (@toll/sdk)", desc: "TollClient handles 402 detection, payment signing, retry, and budget tracking. One-line tool calls.", icon: "svg-code" },
  { title: "Dynamic Pricing Engine", desc: "Static, time-of-day, demand-based, tiered volume discounts, A/B testing, and auto-negotiation.", icon: "svg-chart" },
  { title: "SpendingPolicy Trust Primitive", desc: "Per-call limits, daily budgets, caller allowlists/blocklists. Enforced before payment, not after.", icon: "svg-shield" },
  { title: "Pre-Funded Sessions", desc: "Pay once, call many. Session tokens eliminate per-call transaction latency for high-frequency agents.", icon: "svg-bolt" },
  { title: "Tamper-Evident Audit Log", desc: "SHA-256 hash chain in SQLite. Every payment, failure, and policy violation is cryptographically linked.", icon: "svg-lock" },
  { title: "Stellar Keypair Auth", desc: "Challenge-response authentication using Stellar key pairs. Cryptographic identity, not just IP or API keys.", icon: "svg-key" },
  { title: "Prometheus Metrics", desc: "Production-grade observability: request counts, payment amounts, latency histograms, policy rejections.", icon: "svg-activity" },
  { title: "Multi-Asset Support", desc: "USDC, XLM, EURC, or any custom Stellar asset. AssetRegistry resolves SAC addresses per network.", icon: "svg-currency" },
  { title: "Webhooks", desc: "Real-time events: payment.received, payment.failed, policy.violation, budget.exhausted. HMAC-signed.", icon: "svg-webhook" },
  { title: "Soroban Contracts", desc: "Escrow for high-value calls (dispute/release/refund) and revenue share (multi-destination splits).", icon: "svg-contract" },
  { title: "SAPS Standard", desc: "Stellar Agent Payment Standard — a proposed protocol for interoperable agent payments on Stellar.", icon: "svg-doc" },
]

const ICON_MAP: Record<string, React.ReactNode> = {
  "svg-exchange": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
  "svg-code": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
  "svg-chart": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  "svg-shield": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  "svg-bolt": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
  "svg-lock": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  "svg-key": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  "svg-activity": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /></svg>,
  "svg-currency": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  "svg-webhook": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
  "svg-contract": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  "svg-doc": <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
}

const STEPS = [
  { num: "01", title: "Configure", desc: "Run toll init or write toll.config.json. Define tools, prices, spending policies, and API keys.", accent: "from-emerald-500/20 to-transparent" },
  { num: "02", title: "Wrap", desc: "Add tollMiddleware() + createHealthRoutes(). One import, two lines. Handles payment, auth, metrics.", accent: "from-blue-500/20 to-transparent" },
  { num: "03", title: "Earn", desc: "Agents pay USDC on Stellar per call. Sessions for bulk. Dashboard tracks everything in real time.", accent: "from-purple-500/20 to-transparent" },
]

const PACKAGES = [
  { name: "@toll/gateway", desc: "Server middleware, pricing, sessions, health, metrics, webhooks", exports: 33 },
  { name: "@toll/stellar", desc: "Verifiers, earnings, auth, audit, analytics, assets", exports: 20 },
  { name: "@toll/sdk", desc: "Agent client — TollClient, TollAggregator", exports: 8 },
  { name: "@toll/cli", desc: "Developer CLI — toll init, toll status", exports: 2 },
  { name: "@toll/contracts", desc: "Soroban interfaces — escrow, revenue share, payment", exports: 6 },
]

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 bg-grid">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Stellar Hacks: Agents 2026
            </span>
          </div>
          <h1 className="animate-fade-in delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            The agent revenue<br />protocol for<br /><span className="text-gradient">Stellar</span>
          </h1>
          <p className="animate-fade-in delay-200 text-base sm:text-lg text-gray-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            5 packages. 30 features. Spending policies, dual-protocol settlement, dynamic pricing,
            session tokens, agent SDK, and real-time analytics — all on Stellar.
          </p>
          <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/demo" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              Watch the Demo
            </Link>
            <Link href="/docs" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">
              Read the Docs
            </Link>
          </div>
          <div className="animate-fade-in delay-500 flex items-center justify-center gap-6 mt-12 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-500" />5 Packages</span>
            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500" />30 Features</span>
            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-purple-500" />38 Tests</span>
            <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500" />SAPS Standard</span>
          </div>
        </div>
      </section>

      {/* Five Primitives */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Architecture</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Five composable primitives</h2>
            <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto">Each independently useful. Together they form a complete agent revenue stack.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRIMITIVES.map((p, i) => (
              <div key={p.name} className={`animate-fade-in delay-${(i + 1) * 100} rounded-2xl border ${p.border} ${p.bg} p-6 hover:scale-[1.02] transition-transform duration-200 ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                <span className={`text-xs font-mono font-semibold ${p.color} uppercase tracking-widest`}>{p.name}</span>
                <p className="text-sm text-gray-400 leading-relaxed mt-3">{p.desc}</p>
              </div>
            ))}
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
              <div key={step.num} className={`animate-fade-in-slow delay-${(i + 1) * 200} rounded-2xl border border-white/5 bg-gradient-to-b ${step.accent} p-8 relative group hover:border-white/10 transition-all duration-300`}>
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

      {/* Packages */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Ecosystem</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">5 packages, complete stack</h2>
          </div>
          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div>
                  <span className="text-sm font-semibold text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pkg.name}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.desc}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{pkg.exports} exports</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code: Server + Agent */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Integration</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Server + Agent in minutes</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Server side</p>
              <div className="glow-emerald rounded-2xl">
                <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Agent side</p>
              <CodeBlock code={SDK_SNIPPET} language="typescript" filename="agent.ts" />
              <div className="mt-4">
                <CodeBlock code={CLI_SNIPPET} language="bash" filename="terminal" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12 Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">30 Features</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Built for the agent economy</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`animate-fade-in delay-${(i % 3) * 100 + 100} rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors">
                  {ICON_MAP[f.icon]}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Toll vs raw x402 */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Differentiation</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Why Toll vs. raw x402</h2>
            <p className="text-sm text-gray-500 mt-3">x402 is a protocol. Toll is the infrastructure layer on top.</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-left font-medium">Capability</th>
                  <th className="px-6 py-4 text-center font-medium">Raw x402</th>
                  <th className="px-6 py-4 text-center font-medium text-emerald-400">Toll</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["Dual protocol (x402 + MPP)", false, true],
                  ["Spending policies & budget caps", false, true],
                  ["Dynamic / tiered / A/B pricing", false, true],
                  ["Pre-funded session tokens", false, true],
                  ["Agent SDK (auto-pay + budget)", false, true],
                  ["Replay protection + audit log", false, true],
                  ["Prometheus metrics + health", false, true],
                  ["Webhooks + invoices", false, true],
                  ["CLI scaffolding (toll init)", false, true],
                  ["Soroban escrow + revenue share", false, true],
                  ["Multi-asset (USDC, XLM, custom)", false, true],
                  ["SAPS standard specification", false, true],
                  ["Stellar-native settlement", true, true],
                  ["HTTP 402 standard", true, true],
                ].map(([cap, raw, toll]) => (
                  <tr key={cap as string} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3 text-gray-300">{cap as string}</td>
                    <td className="px-6 py-3 text-center">{raw ? <span className="text-gray-400">&#10003;</span> : <span className="text-gray-700">&mdash;</span>}</td>
                    <td className="px-6 py-3 text-center">{toll ? <span className="text-emerald-400">&#10003;</span> : <span className="text-gray-700">&mdash;</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <h3 className="text-lg font-bold text-white mb-2">Complete agent revenue stack</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                5 packages, 30 features, 38 tests. Dual-protocol settlement, spending policies,
                dynamic pricing, session tokens, and the SAPS standard.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noopener noreferrer" className="text-xs px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition-colors">Stellar Expert &rarr;</a>
                <Link href="/dashboard" className="text-xs px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-colors">View Dashboard</Link>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-xs space-y-2 w-full md:w-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Packages</span><span className="text-emerald-400">5</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Features</span><span className="text-gray-300">30</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Tests</span><span className="text-emerald-400">38 passing</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Protocols</span><span className="text-blue-400">x402 + MPP</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Security</span><span className="text-amber-400">SpendingPolicy</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Standard</span><span className="text-purple-400">SAPS v0.1</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Example */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Example tool pricing</h2>
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
                    <td className="px-6 py-4"><span className="text-gray-200 font-medium">{tool.name}</span></td>
                    <td className="px-6 py-4"><ProtocolBadge protocol={tool.protocol} /></td>
                    <td className="px-6 py-4 text-right"><span className={`font-semibold tabular-nums ${parseFloat(tool.price) === 0 ? "text-gray-500" : "text-emerald-400"}`}>{parseFloat(tool.price) === 0 ? "Free" : `$${tool.price}`}</span></td>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Start earning from your MCP tools</h2>
          <p className="text-gray-500 mb-10 text-sm leading-relaxed">Set up Toll on Stellar testnet in under 5 minutes. 5 packages, zero lock-in.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">Watch the Demo</Link>
            <Link href="/docs" className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-white/5">Read the Docs</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
