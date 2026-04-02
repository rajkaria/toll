import { CodeBlock } from "@/components/shared/CodeBlock"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET, CONNECT_SNIPPET } from "@/lib/snippets"

const TOC = [
  { id: "quick-start", label: "Quick Start" },
  { id: "configuration", label: "Configuration" },
  { id: "payment-flows", label: "Payment Flows" },
  { id: "api-reference", label: "API Reference" },
]

function Anchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-20" />
}

export default function DocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Documentation</h1>
      <p className="text-sm text-gray-500 mb-10">Everything you need to integrate Toll into your MCP server</p>

      {/* TOC */}
      <nav className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4 mb-16">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">On this page</p>
        <ul className="space-y-1">
          {TOC.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Start */}
      <Anchor id="quick-start" />
      <section className="mb-16">
        <h2 className="text-xl font-bold text-white mb-4">Quick Start</h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          Toll works as Express middleware that intercepts MCP tool calls and enforces payment before execution.
        </p>

        <h3 className="text-sm font-bold text-gray-200 mb-2 mt-6">1. Install packages</h3>
        <CodeBlock code="npm install @toll/gateway @toll/stellar" language="bash" />

        <h3 className="text-sm font-bold text-gray-200 mb-2 mt-6">2. Create toll.config.json</h3>
        <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />

        <h3 className="text-sm font-bold text-gray-200 mb-2 mt-6">3. Add middleware to your server</h3>
        <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />

        <h3 className="text-sm font-bold text-gray-200 mb-2 mt-6">4. Set up testnet wallets</h3>
        <CodeBlock code={`npx tsx scripts/setup-wallet.ts\n# Generates keypairs, funds via Friendbot, prints .env config`} language="bash" />

        <h3 className="text-sm font-bold text-gray-200 mb-2 mt-6">5. Connect an MCP client</h3>
        <CodeBlock code={CONNECT_SNIPPET} language="json" filename="mcp-client-config.json" />
      </section>

      {/* Configuration */}
      <div className="border-t border-gray-800" />
      <Anchor id="configuration" />
      <section className="mb-16 pt-10">
        <h2 className="text-xl font-bold text-white mb-4">Configuration Reference</h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-6">
          All configuration lives in a single <code className="text-emerald-400 bg-gray-800 px-1 rounded">toll.config.json</code> file.
        </p>

        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
                <th className="px-4 py-3 text-left">Field</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ["network", '"testnet" | "mainnet"', "Stellar network to use"],
                ["payTo", "string", "Stellar address (G...) that receives payments"],
                ["facilitatorUrl", "string", "x402 facilitator URL for on-chain settlement"],
                ["defaultPaymentMode", '"x402" | "mpp"', "Default protocol for all tools"],
                ["tools", "Record<string, ToolConfig>", "Map of tool name to pricing config"],
                ["tools[].price", "string", 'Decimal string price in USDC (e.g. "0.01")'],
                ["tools[].currency", '"USDC"', "Payment currency (only USDC supported)"],
                ["tools[].paymentMode", '"x402" | "mpp"', "Override default payment mode per tool"],
                ["tools[].rateLimit.free", "number", "Free calls before payment required"],
                ["tools[].rateLimit.perHour", "boolean", "Rate limit window (true = hourly, false = daily)"],
                ["dataDir", "string", "SQLite database directory (default: ~/.toll)"],
              ].map(([field, type, desc]) => (
                <tr key={field} className="border-b border-gray-800/50">
                  <td className="px-4 py-2 text-emerald-400 font-mono">{field}</td>
                  <td className="px-4 py-2 text-gray-400 font-mono">{type}</td>
                  <td className="px-4 py-2 text-gray-300">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment Flows */}
      <div className="border-t border-gray-800" />
      <Anchor id="payment-flows" />
      <section className="mb-16 pt-10">
        <h2 className="text-xl font-bold text-white mb-6">Payment Flows</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* x402 */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 border-t-2 border-t-blue-500">
            <h3 className="text-sm font-bold text-blue-300 mb-4">x402 (HTTP 402)</h3>
            <ol className="space-y-3 text-xs text-gray-300">
              {[
                "Agent POSTs tool call to /mcp",
                "Toll returns HTTP 402 with PaymentRequired JSON",
                "Agent signs a Stellar USDC transaction",
                "Agent retries with payment-signature header",
                "Toll verifies via facilitator /settle endpoint",
                "Tool executes, earnings recorded to SQLite",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* MPP */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 border-t-2 border-t-purple-500">
            <h3 className="text-sm font-bold text-purple-300 mb-4">MPP (Machine Payments Protocol)</h3>
            <ol className="space-y-3 text-xs text-gray-300">
              {[
                "Agent POSTs tool call to /mcp",
                "Toll returns 402 with WWW-Authenticate: Payment",
                "Agent signs payment via @stellar/mpp channel",
                "Agent retries with Authorization: Payment header",
                "Toll verifies via mppx middleware",
                "Tool executes, earnings recorded to SQLite",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <div className="border-t border-gray-800" />
      <Anchor id="api-reference" />
      <section className="mb-16 pt-10">
        <h2 className="text-xl font-bold text-white mb-6">API Reference</h2>

        {/* tollMiddleware */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 mb-6">
          <h3 className="text-sm font-bold text-emerald-400 font-mono mb-2">tollMiddleware(config: TollConfig): RequestHandler</h3>
          <p className="text-xs text-gray-400 mb-3">
            Express middleware that intercepts MCP <code className="text-gray-300">tools/call</code> requests and enforces payment.
            Returns HTTP 402 with x402 or MPP challenge if payment is missing. Verifies payment headers on retry.
          </p>
          <CodeBlock code={`app.use("/mcp", tollMiddleware(config))`} language="typescript" />
        </div>

        {/* withToll */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 mb-6">
          <h3 className="text-sm font-bold text-emerald-400 font-mono mb-2">withToll(server: McpServer, config: TollConfig): McpServer</h3>
          <p className="text-xs text-gray-400 mb-3">
            Wraps MCP tool handlers for stdio transport. Paid tools return a JSON-RPC error with payment
            information instead of executing. Use alongside <code className="text-gray-300">tollMiddleware</code> for HTTP transport.
          </p>
          <CodeBlock code={`const mcpServer = createMcpServer()\nwithToll(mcpServer, config)`} language="typescript" />
        </div>

        {/* loadConfig */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 mb-6">
          <h3 className="text-sm font-bold text-emerald-400 font-mono mb-2">loadConfig(path: string): TollConfig</h3>
          <p className="text-xs text-gray-400 mb-3">
            Reads and validates a toll.config.json file using Zod schema validation.
            Throws if the config is invalid.
          </p>
          <CodeBlock code={`const config = loadConfig("./toll.config.json")`} language="typescript" />
        </div>

        {/* EarningsTracker */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
          <h3 className="text-sm font-bold text-emerald-400 font-mono mb-2">new EarningsTracker(dataDir?: string)</h3>
          <p className="text-xs text-gray-400 mb-3">
            SQLite-backed earnings tracker. Records payments, queries stats, per-tool breakdown, and protocol split.
            Default directory: <code className="text-gray-300">~/.toll</code>.
          </p>
          <CodeBlock code={`const tracker = new EarningsTracker()\ntracker.record({ tool, caller, amountUsdc, protocol, txHash })\nconst stats = tracker.getStats()   // { totalEarnings, totalCalls, ... }\nconst byTool = tracker.getByTool() // [{ tool, calls, revenue, avgPrice }]`} language="typescript" />
        </div>
      </section>
    </main>
  )
}
