import { CodeBlock } from "@/components/shared/CodeBlock"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET, CONNECT_SNIPPET } from "@/lib/snippets"

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "quick-start", label: "Quick Start" },
  { id: "configuration", label: "Configuration" },
  { id: "payment-flows", label: "Payment Flows" },
  { id: "api-reference", label: "API Reference" },
  { id: "earnings-tracking", label: "Earnings Tracking" },
  { id: "security", label: "Security" },
  { id: "deployment", label: "Deployment" },
]

function Anchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-24" />
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-white tracking-tight mb-6">{children}</h2>
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-200 mb-3 mt-8">{children}</h3>
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 leading-relaxed mb-4">{children}</p>
}

function Divider() {
  return <div className="border-t border-white/5 my-16" />
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 my-6">
      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

export default function DocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="animate-fade-in">
        <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Documentation</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Toll Gateway Docs</h1>
        <p className="text-sm text-gray-500 mb-12">Everything you need to monetize your MCP server with Stellar micropayments</p>
      </div>

      {/* TOC */}
      <nav className="animate-fade-in delay-100 rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-16">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-medium">On this page</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Overview */}
      <Anchor id="overview" />
      <section>
        <SectionTitle>Overview</SectionTitle>
        <Prose>
          Toll is a payment gateway for MCP (Model Context Protocol) servers. It sits between AI agents
          and your tool implementations, enforcing micropayments on the Stellar network before tool execution.
        </Prose>
        <Prose>
          When an AI agent calls a paid tool, Toll intercepts the request and returns an HTTP 402 response
          with payment requirements. The agent signs a USDC transaction on Stellar, retries with the payment
          proof, and Toll verifies the payment before allowing the tool to execute.
        </Prose>

        <InfoBox title="Key Concepts">
          <ul className="space-y-2 text-sm">
            <li><strong className="text-white">MCP Server</strong> — Your server exposing tools via the Model Context Protocol</li>
            <li><strong className="text-white">Toll Gateway</strong> — Express middleware that gates tool access behind payments</li>
            <li><strong className="text-white">x402</strong> — HTTP 402-based payment protocol with on-chain verification</li>
            <li><strong className="text-white">MPP</strong> — Machine Payments Protocol for session-based Stellar payment channels</li>
            <li><strong className="text-white">USDC</strong> — USD Coin stablecoin on Stellar (7 decimal places)</li>
            <li><strong className="text-white">Facilitator</strong> — x402 settlement service that verifies transactions on-chain</li>
          </ul>
        </InfoBox>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 my-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-medium">Architecture</p>
          <div className="flex items-center justify-between text-xs text-gray-400 py-4 overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <div className="flex items-center gap-3 min-w-max">
              <span className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300">AI Agent</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Toll Middleware</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-300">MCP Server</span>
              <span className="text-gray-600 mx-2">|</span>
              <span className="px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">Stellar Network</span>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* Quick Start */}
      <Anchor id="quick-start" />
      <section>
        <SectionTitle>Quick Start</SectionTitle>

        <SubTitle>1. Install packages</SubTitle>
        <CodeBlock code="npm install @toll/gateway @toll/stellar express @modelcontextprotocol/sdk" language="bash" />

        <SubTitle>2. Create toll.config.json</SubTitle>
        <Prose>
          Define your tools, prices, and payment modes. Each tool maps to a price in USDC and
          an optional payment protocol override.
        </Prose>
        <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />

        <SubTitle>3. Add middleware to your server</SubTitle>
        <Prose>
          Place <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>tollMiddleware()</code> before
          your MCP transport. It intercepts <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>tools/call</code> requests
          and enforces payment.
        </Prose>
        <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />

        <SubTitle>4. Set up testnet wallets</SubTitle>
        <Prose>
          Generate keypairs for your server (receives payments) and a test agent (sends payments).
          Friendbot funds both with 10,000 XLM on testnet.
        </Prose>
        <CodeBlock code={`# Generate keypairs and fund via Friendbot
pnpm --filter toll-scripts exec tsx setup-wallet.ts

# Output:
# Server wallet: GABCD... (receives payments)
# Agent wallet:  GEFGH... (sends payments)
# Both funded with 10,000 XLM`} language="bash" />

        <SubTitle>5. Create .env file</SubTitle>
        <CodeBlock code={`PORT=3002
TOLL_SERVER_SECRET=S...your_server_secret_key
TOLL_SERVER_ADDRESS=G...your_server_public_key
ANTHROPIC_API_KEY=sk-ant-...  # optional, for Claude-powered tools
TOLL_DATA_DIR=~/.toll
X402_FACILITATOR_URL=https://x402-facilitator.stellar.org`} language="bash" filename=".env" />

        <SubTitle>6. Connect an MCP client</SubTitle>
        <CodeBlock code={CONNECT_SNIPPET} language="json" filename="mcp-client-config.json" />

        <InfoBox title="Testnet Note">
          For x402 payments to settle, the agent wallet needs USDC on Stellar testnet.
          Friendbot only provides XLM. Use the Stellar Laboratory to add a USDC trustline and issue test tokens.
        </InfoBox>
      </section>

      <Divider />

      {/* Configuration */}
      <Anchor id="configuration" />
      <section>
        <SectionTitle>Configuration Reference</SectionTitle>
        <Prose>
          All configuration lives in a single <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>toll.config.json</code> file,
          validated at startup using Zod schemas.
        </Prose>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3.5 text-left font-medium">Field</th>
                <th className="px-5 py-3.5 text-left font-medium">Type</th>
                <th className="px-5 py-3.5 text-left font-medium">Required</th>
                <th className="px-5 py-3.5 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {([
                ["network", '"testnet" | "mainnet"', "Yes", "Stellar network"],
                ["payTo", "string", "Yes", "Server's Stellar address (G...)"],
                ["facilitatorUrl", "string", "Yes", "x402 facilitator URL"],
                ["defaultPaymentMode", '"x402" | "mpp"', "Yes", "Default protocol for all tools"],
                ["tools", "Record<string, Tool>", "Yes", "Map of tool name to config"],
                ["tools[].price", "string", "Yes", 'Price in USDC (e.g. "0.01")'],
                ["tools[].currency", '"USDC"', "Yes", "Payment currency"],
                ["tools[].paymentMode", '"x402" | "mpp"', "No", "Override default per tool"],
                ["tools[].description", "string", "No", "Human-readable description"],
                ["tools[].rateLimit.free", "number", "No", "Free calls before payment"],
                ["tools[].rateLimit.perHour", "boolean", "No", "true = hourly, false = daily"],
                ["dataDir", "string", "No", "SQLite data directory (~/.toll)"],
              ] as const).map(([field, type, req, desc]) => (
                <tr key={field} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-emerald-400">{field}</td>
                  <td className="px-5 py-3 text-gray-500">{type}</td>
                  <td className="px-5 py-3">
                    <span className={req === "Yes" ? "text-white" : "text-gray-600"}>{req}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>USDC Decimal Precision</SubTitle>
        <Prose>
          USDC on Stellar uses 7 decimal places. The price field accepts human-readable values.
          Internally, Toll converts to base units using <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>toUsdcBaseUnits()</code>:
        </Prose>
        <CodeBlock code={`"0.01"  USDC  →  100000   base units
"0.001" USDC  →  10000    base units
"1.00"  USDC  →  10000000 base units`} language="text" />
      </section>

      <Divider />

      {/* Payment Flows */}
      <Anchor id="payment-flows" />
      <section>
        <SectionTitle>Payment Flows</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* x402 */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 border-t-2 border-t-blue-500">
            <h3 className="text-base font-bold text-blue-300 mb-5">x402 Protocol</h3>
            <ol className="space-y-4">
              {[
                ["POST", "Agent sends tool call to /mcp"],
                ["CHECK", "Toll checks for payment-signature header"],
                ["402", "If missing, returns HTTP 402 + PaymentRequired"],
                ["SIGN", "Agent signs Stellar USDC transaction"],
                ["RETRY", "Agent retries with payment-signature header"],
                ["SETTLE", "Toll POSTs to facilitator /settle"],
                ["VERIFY", "Facilitator verifies on Stellar network"],
                ["EXEC", "Tool executes, earnings recorded"],
              ].map(([label, step], i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="shrink-0 w-12 text-right text-blue-500/60 font-mono uppercase">{label}</span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* MPP */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 border-t-2 border-t-purple-500">
            <h3 className="text-base font-bold text-purple-300 mb-5">MPP Protocol</h3>
            <ol className="space-y-4">
              {[
                ["POST", "Agent sends tool call to /mcp"],
                ["CHECK", "Toll checks for Authorization header"],
                ["402", "Returns 402 + WWW-Authenticate: Payment"],
                ["SIGN", "Agent signs via @stellar/mpp channel"],
                ["RETRY", "Agent retries with Authorization: Payment"],
                ["VERIFY", "Toll verifies via mppx middleware"],
                ["SETTLE", "Payment confirmed via smart contract"],
                ["EXEC", "Tool executes, earnings recorded"],
              ].map(([label, step], i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="shrink-0 w-12 text-right text-purple-500/60 font-mono uppercase">{label}</span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <SubTitle>Free Tool Bypass</SubTitle>
        <Prose>
          Tools with <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{`"price": "0"`}</code> skip
          all payment checks. Unknown tool names also pass through. This lets you mix free and paid tools on the same server.
        </Prose>

        <SubTitle>Rate Limiting</SubTitle>
        <Prose>
          Configure a free tier with <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>rateLimit</code> —
          the first N calls per IP are free, then payment is required. Rate limits reset hourly or daily.
        </Prose>
        <CodeBlock code={`"search_competitors": {
  "price": "0.01",
  "currency": "USDC",
  "rateLimit": {
    "free": 5,
    "perHour": true
  }
}`} language="json" />
      </section>

      <Divider />

      {/* API Reference */}
      <Anchor id="api-reference" />
      <section>
        <SectionTitle>API Reference</SectionTitle>

        {[
          {
            sig: "tollMiddleware(config: TollConfig): RequestHandler",
            pkg: "@toll/gateway",
            desc: "Express middleware that intercepts MCP tools/call requests and enforces payment. Place before your StreamableHTTPServerTransport handler.",
            example: `import { tollMiddleware, loadConfig } from "@toll/gateway"

const config = loadConfig("./toll.config.json")
app.use("/mcp", tollMiddleware(config))`,
          },
          {
            sig: "withToll(server: McpServer, config: TollConfig): McpServer",
            pkg: "@toll/gateway",
            desc: "Wraps MCP tool handlers for stdio transport. Paid tools return a JSON-RPC error with payment info instead of executing. Use alongside tollMiddleware for HTTP.",
            example: `const mcpServer = createMcpServer()
withToll(mcpServer, config)`,
          },
          {
            sig: "loadConfig(path: string): TollConfig",
            pkg: "@toll/gateway",
            desc: "Reads and validates a toll.config.json file. Throws with descriptive errors if validation fails.",
            example: `const config = loadConfig("./toll.config.json")
console.log(config.payTo)  // G...
console.log(config.tools)  // { tool_name: { price, currency, ... } }`,
          },
          {
            sig: "new EarningsTracker(dataDir?: string)",
            pkg: "@toll/stellar",
            desc: "SQLite-backed tracker for payment records. Auto-creates the database and schema. Default directory: ~/.toll",
            example: `const tracker = new EarningsTracker("./data")

// Record a payment
tracker.record({
  tool: "search_competitors",
  caller: "GABCD...",
  amountUsdc: 0.01,
  protocol: "x402",
  txHash: "abc123..."
})

// Query stats
tracker.getStats()         // { totalEarnings, totalCalls, ... }
tracker.getByTool()        // [{ tool, calls, revenue, avgPrice }]
tracker.getRecent(20)      // last 20 transactions
tracker.getProtocolSplit() // { x402: 75, mpp: 25 }

tracker.close() // always close when done`,
          },
          {
            sig: "new X402Verifier(config: TollConfig)",
            pkg: "@toll/stellar",
            desc: "Builds x402 PaymentRequired responses and verifies payments via the facilitator /settle endpoint.",
            example: `const verifier = new X402Verifier(config)

// Build 402 response
const requirements = verifier.buildRequirements("tool_name", "0.01", resourceUrl)

// Verify payment
const result = await verifier.settle(paymentSignatureHeader, requirements)
// { success: true, transaction: "hash...", payer: "G..." }`,
          },
        ].map((api) => (
          <div key={api.sig} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-sm font-semibold text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {api.sig}
              </h3>
              <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {api.pkg}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">{api.desc}</p>
            <CodeBlock code={api.example} language="typescript" />
          </div>
        ))}
      </section>

      <Divider />

      {/* Earnings Tracking */}
      <Anchor id="earnings-tracking" />
      <section>
        <SectionTitle>Earnings Tracking</SectionTitle>
        <Prose>
          Toll automatically records every paid tool call to a local SQLite database. The dashboard reads this
          database to show real-time earnings analytics.
        </Prose>

        <SubTitle>Database Schema</SubTitle>
        <CodeBlock code={`CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,     -- UUID
  tool        TEXT NOT NULL,        -- tool name
  caller      TEXT,                 -- Stellar address or IP
  amount_usdc REAL NOT NULL,        -- payment amount in USDC
  protocol    TEXT NOT NULL,        -- "x402" or "mpp"
  tx_hash     TEXT,                 -- on-chain transaction hash
  created_at  INTEGER NOT NULL      -- Unix timestamp (ms)
);`} language="sql" filename="~/.toll/earnings.db" />

        <SubTitle>Dashboard Integration</SubTitle>
        <Prose>
          The Next.js dashboard at <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>/dashboard</code> reads
          the same SQLite file. Set <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TOLL_DATA_DIR</code> environment
          variable to point both the MCP server and dashboard to the same database.
        </Prose>
      </section>

      <Divider />

      {/* Security */}
      <Anchor id="security" />
      <section>
        <SectionTitle>Security</SectionTitle>

        <div className="space-y-4">
          {[
            { title: "Payment Verification", desc: "x402 payments are verified on-chain via the facilitator. Toll never trusts client-provided payment claims without verification." },
            { title: "No Private Keys in Config", desc: "Server secret keys go in .env (excluded from git), not in toll.config.json. The config file only contains the public payTo address." },
            { title: "Rate Limiting", desc: "Built-in per-IP rate limiting prevents abuse of free tiers. Limits are enforced in-memory per server instance." },
            { title: "Input Validation", desc: "All configuration is validated at startup using Zod schemas. Invalid configs fail fast with descriptive errors." },
            { title: "Middleware Ordering", desc: "tollMiddleware runs before the MCP transport, ensuring payment is verified before tool code executes. There is no way to bypass the payment check." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Deployment */}
      <Anchor id="deployment" />
      <section>
        <SectionTitle>Deployment</SectionTitle>
        <Prose>
          The Toll gateway runs as a standard Node.js Express server. Deploy anywhere you can run Node.js.
        </Prose>

        <SubTitle>MCP Server (Express)</SubTitle>
        <CodeBlock code={`# Build
pnpm --filter demo-server build

# Start in production
node apps/demo-server/dist/index.js`} language="bash" />

        <SubTitle>Dashboard (Next.js)</SubTitle>
        <Prose>
          The dashboard deploys to Vercel. Set the <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TOLL_DATA_DIR</code> environment
          variable in Vercel to point to your SQLite database location.
        </Prose>
        <CodeBlock code={`# Deploy to Vercel
cd apps/dashboard && npx vercel --prod`} language="bash" />

        <SubTitle>Environment Variables</SubTitle>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3 text-left font-medium">Variable</th>
                <th className="px-5 py-3 text-left font-medium">Required</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {[
                ["PORT", "No", "Server port (default: 3002)"],
                ["TOLL_SERVER_SECRET", "Yes", "Stellar secret key for MPP signing"],
                ["TOLL_SERVER_ADDRESS", "Yes", "Stellar public key (must match payTo)"],
                ["ANTHROPIC_API_KEY", "No", "For Claude-powered tools"],
                ["TOLL_DATA_DIR", "No", "SQLite directory (default: ~/.toll)"],
                ["X402_FACILITATOR_URL", "Yes", "x402 facilitator endpoint"],
              ].map(([name, req, desc]) => (
                <tr key={name} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-emerald-400">{name}</td>
                  <td className="px-5 py-3"><span className={req === "Yes" ? "text-white" : "text-gray-600"}>{req}</span></td>
                  <td className="px-5 py-3 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>Running Tests</SubTitle>
        <CodeBlock code={`# All tests (33 total)
pnpm -r test

# Individual packages
pnpm --filter @toll/stellar test    # 8 tests
pnpm --filter @toll/gateway test    # 15 tests
pnpm --filter demo-server test      # 10 integration tests`} language="bash" />
      </section>
    </main>
  )
}
