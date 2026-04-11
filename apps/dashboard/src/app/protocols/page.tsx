import { CodeBlock } from "@/components/shared/CodeBlock"

const X402_STEPS = [
  "Agent sends POST /mcp with tool call",
  "Toll checks for payment-signature header",
  "If missing, returns HTTP 402 + PaymentRequired JSON",
  "Agent signs Stellar USDC transaction with exact amount",
  "Agent retries with base64-encoded payment-signature header",
  "Toll POSTs to x402 facilitator /settle endpoint",
  "Facilitator verifies transaction on Stellar network",
  "Tool executes, earnings recorded",
]

const MPP_STEPS = [
  "Agent sends POST /mcp with tool call",
  "Toll checks for Authorization: Payment header",
  "If missing, returns 402 + WWW-Authenticate: Payment challenge",
  "Agent signs payment via @stellar/mpp channel",
  "Agent retries with Authorization: Payment token",
  "Toll verifies via mppx paywall",
  "Payment confirmed through Stellar smart contract",
  "Tool executes, earnings recorded",
]

const COMPARISONS = [
  { scenario: "One-off tool calls", recommendation: "x402", rationale: "Simple single-payment flow, no session setup needed" },
  { scenario: "High-frequency API calls", recommendation: "MPP", rationale: "Session-based channel reduces per-call overhead" },
  { scenario: "Variable pricing", recommendation: "x402", rationale: "Each call can have different payment amount" },
  { scenario: "Bulk agent workflows", recommendation: "MPP", rationale: "Pre-funded channel handles many calls efficiently" },
  { scenario: "Maximum compatibility", recommendation: "x402", rationale: "HTTP 402 is a web standard, easier client integration" },
  { scenario: "Streaming payments", recommendation: "MPP", rationale: "Channel-based model supports ongoing payment streams" },
]

export default function ProtocolsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight">Payment Protocols</h1>
        <p className="text-sm text-gray-500 mt-2">
          Toll supports two Stellar payment protocols — choose per tool or mix both
        </p>
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* x402 */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden border-t-2 border-t-blue-500">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-900/60 text-blue-300">X402</span>
              <h2 className="text-lg font-bold text-white">HTTP 402 Protocol</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Uses the HTTP 402 Payment Required status code. The server returns payment requirements,
              the client signs a Stellar transaction, and retries with the payment signature header.
              Settlement is verified on-chain via an x402 facilitator.
            </p>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Flow</h3>
            <ol className="space-y-2 mb-6">
              {X402_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-gray-300">
                  <span className="text-blue-400 font-bold shrink-0 w-4">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Advantages</h3>
            <ul className="space-y-1 mb-6">
              {["Web standard (HTTP 402)", "Simple request/response flow", "Per-call payment flexibility", "On-chain settlement proof"].map((a) => (
                <li key={a} className="text-xs text-gray-300 flex gap-2">
                  <span className="text-blue-400">+</span> {a}
                </li>
              ))}
            </ul>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Trade-offs</h3>
            <ul className="space-y-1">
              {["Two HTTP round-trips per paid call", "Requires x402 facilitator service", "Higher per-call overhead for bulk usage"].map((t) => (
                <li key={t} className="text-xs text-gray-400 flex gap-2">
                  <span className="text-gray-600">-</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MPP */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden border-t-2 border-t-purple-500">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-900/60 text-purple-300">MPP</span>
              <h2 className="text-lg font-bold text-white">Machine Payments Protocol</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Session-based payment channel using Stellar smart contracts. The agent opens a payment
              channel, then uses the Authorization header for subsequent calls. Ideal for high-frequency
              agent workflows.
            </p>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Flow</h3>
            <ol className="space-y-2 mb-6">
              {MPP_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-gray-300">
                  <span className="text-purple-400 font-bold shrink-0 w-4">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Advantages</h3>
            <ul className="space-y-1 mb-6">
              {["Lower per-call overhead after setup", "Session-based bulk payments", "Smart contract security", "Streaming payment support"].map((a) => (
                <li key={a} className="text-xs text-gray-300 flex gap-2">
                  <span className="text-purple-400">+</span> {a}
                </li>
              ))}
            </ul>

            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Trade-offs</h3>
            <ul className="space-y-1">
              {["Requires @stellar/mpp SDK on client", "Channel setup overhead for single calls", "Newer protocol, smaller ecosystem"].map((t) => (
                <li key={t} className="text-xs text-gray-400 flex gap-2">
                  <span className="text-gray-600">-</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white tracking-tight text-center mb-8">
          When to Use Which
        </h2>
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
                <th className="px-4 py-3 text-left">Scenario</th>
                <th className="px-4 py-3 text-left">Recommended</th>
                <th className="px-4 py-3 text-left">Why</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISONS.map((c) => (
                <tr key={c.scenario} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-gray-200 text-xs">{c.scenario}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.recommendation === "x402" ? "bg-blue-900/60 text-blue-300" : "bg-purple-900/60 text-purple-300"
                    }`}>
                      {c.recommendation.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Examples */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-white tracking-tight text-center mb-8">
          Configuration Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-blue-400 mb-2 uppercase tracking-widest">x402 tool config</p>
            <CodeBlock
              code={`"search_competitors": {\n  "price": "0.01",\n  "currency": "USDC",\n  "paymentMode": "x402"\n}`}
              language="json"
            />
          </div>
          <div>
            <p className="text-xs text-purple-400 mb-2 uppercase tracking-widest">MPP tool config</p>
            <CodeBlock
              code={`"compare_products": {\n  "price": "0.05",\n  "currency": "USDC",\n  "paymentMode": "mpp"\n}`}
              language="json"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
