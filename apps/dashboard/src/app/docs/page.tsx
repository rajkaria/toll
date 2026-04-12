import { CodeBlock } from "@/components/shared/CodeBlock"
import { QUICK_START_SNIPPET, TOLL_CONFIG_SNIPPET, CONNECT_SNIPPET, PROXY_SNIPPET, PROXY_CONFIG_SNIPPET, REGISTRY_SNIPPET, WALLET_SNIPPET, GETTING_STARTED_SNIPPET } from "@/lib/snippets"

const TOC = [
  { id: "first-payment", label: "Make your first payment" },
  { id: "quick-start", label: "Quick Start (server)" },
  { id: "how-it-works", label: "How Toll Works" },
  { id: "configuration", label: "Configuration" },
  { id: "toll-proxy", label: "Toll Proxy" },
  { id: "toll-registry", label: "Tool Registry" },
  { id: "wallet", label: "Wallet Management" },
  { id: "agent-sdk", label: "Agent SDK" },
  { id: "earnings", label: "Earnings & Dashboard" },
  { id: "security", label: "Security" },
  { id: "faq", label: "FAQ & Troubleshooting" },
  { id: "transactions", label: "On-Chain Proof" },
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

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <h4 className="text-sm font-semibold text-white mb-2">{q}</h4>
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  )
}

export default function DocsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="animate-fade-in">
        <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-3">Documentation</p>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Toll Docs</h1>
        <p className="text-sm text-gray-500 mb-12">Add payments to your MCP server. Earn USDC on every tool call. Settled on Stellar in seconds.</p>
      </div>

      <div className="flex gap-10">
        {/* Sticky sidebar */}
        <nav className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-medium">On this page</p>
            <div className="flex flex-col gap-1">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm text-gray-500 hover:text-emerald-400 transition-colors py-1.5 border-l-2 border-transparent hover:border-emerald-500/50 pl-3"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

      {/* ── Make your first payment ── */}
      <Anchor id="first-payment" />
      <section>
        <SectionTitle>Make your first payment</SectionTitle>
        <Prose>
          Pay for a real MCP tool call on Stellar mainnet in under 5 minutes. No server setup required — use the live demo server at <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>api.tollpay.xyz</code>.
        </Prose>

        <SubTitle>1. Install the SDK</SubTitle>
        <CodeBlock code="npm install @rajkaria123/toll-sdk" language="bash" filename="terminal" />

        <SubTitle>2. Create a wallet, fund it, call a tool</SubTitle>
        <Prose>
          Run this once to create a Stellar keypair. Fund your address with at least <strong className="text-white">0.05 USDC</strong> on Stellar mainnet, then call any paid tool — payment is handled automatically.
        </Prose>
        <CodeBlock code={GETTING_STARTED_SNIPPET} language="typescript" filename="quickstart.ts" />

        <InfoBox title="How to get USDC on Stellar mainnet">
          Send USDC to your wallet address from any Stellar-compatible exchange (Coinbase, Kraken, Binance) or use the{" "}
          <a href="/fund" className="text-emerald-400 underline underline-offset-2">Funding Guide</a>.
          The USDC asset ID on Stellar mainnet is <code className="text-emerald-400 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI</code>.
          You also need ~1 XLM for the account reserve.
        </InfoBox>
      </section>

      <Divider />

      {/* ── Quick Start ── */}
      <Anchor id="quick-start" />
      <section>
        <SectionTitle>Quick Start (server)</SectionTitle>
        <Prose>
          Three steps to start earning from your MCP tools.
        </Prose>

        <SubTitle>1. Install</SubTitle>
        <CodeBlock code="npm install @rajkaria123/toll-gateway @rajkaria123/toll-stellar" language="bash" filename="terminal" />

        <SubTitle>2. Create toll.config.json</SubTitle>
        <Prose>
          List your tools with prices. Tools with price {`"0"`} are free. Everything else charges USDC.
        </Prose>
        <CodeBlock code={TOLL_CONFIG_SNIPPET} language="json" filename="toll.config.json" />

        <SubTitle>3. Add middleware to your server</SubTitle>
        <Prose>
          Place <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>tollMiddleware()</code> before
          your MCP transport handler. It intercepts <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>tools/call</code> requests
          and enforces payment before execution.
        </Prose>
        <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />

        <InfoBox title="Mainnet deployment">
          For production on Stellar mainnet, you need a funded Stellar wallet with a USDC trustline.
          Set your public address as <code className="text-emerald-400">payTo</code> in the config.
          The x402 facilitator at <code className="text-emerald-400">channels.openzeppelin.com/x402</code> handles settlement.
        </InfoBox>

        <SubTitle>Connect an MCP client</SubTitle>
        <Prose>
          Point any MCP client (Claude Desktop, Cursor, etc.) to your server.
        </Prose>
        <CodeBlock code={CONNECT_SNIPPET} language="json" filename="mcp-client-config.json" />
      </section>

      <Divider />

      {/* ── How Toll Works ── */}
      <Anchor id="how-it-works" />
      <section>
        <SectionTitle>How Toll Works</SectionTitle>
        <Prose>
          Toll is Express middleware. It sits between AI agents and your MCP tools.
          When an agent calls a paid tool, Toll intercepts the request, requires payment,
          verifies it on Stellar, and then lets the tool execute.
        </Prose>

        {/* Architecture */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 my-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-medium">Request flow</p>
          <div className="flex items-center justify-between text-xs text-gray-400 py-4 overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <div className="flex items-center gap-3 min-w-max">
              <span className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300">AI Agent</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Toll Middleware</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-300">Your MCP Server</span>
              <span className="text-gray-600 mx-2">|</span>
              <span className="px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">Stellar USDC</span>
            </div>
          </div>
        </div>

        <SubTitle>x402 payment flow (per-call)</SubTitle>
        <Prose>
          x402 is the default protocol. Each paid tool call is a separate USDC transaction verified on-chain.
        </Prose>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 my-4">
          <ol className="space-y-3">
            {[
              ["Agent calls tool", "Standard MCP JSON-RPC POST to /mcp"],
              ["Toll checks for payment", "Looks for payment-signature header"],
              ["Returns 402 if unpaid", "Response includes price, payTo address, asset, network"],
              ["Agent signs USDC payment", "Signs a Stellar transaction via x402 SDK"],
              ["Agent retries with proof", "Sends payment-signature header"],
              ["Facilitator verifies on-chain", "OpenZeppelin confirms the Stellar transaction"],
              ["Tool executes", "Payment recorded, tool runs, result returned"],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-3 text-xs">
                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <div>
                  <span className="text-gray-200 font-medium">{title}</span>
                  <span className="text-gray-500 ml-2">&mdash; {desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <SubTitle>MPP payment flow (session-based)</SubTitle>
        <Prose>
          MPP (Machine Payments Protocol) uses Stellar payment channels for session-based billing.
          Set <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>paymentMode: {`"mpp"`}</code> on
          individual tools to use MPP instead of x402. MPP support is experimental.
        </Prose>

        <SubTitle>Free tools and rate limiting</SubTitle>
        <Prose>
          Tools with <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{`"price": "0"`}</code> skip
          all payment checks. You can also set a free tier on paid tools &mdash; the first N calls per IP are free, then payment kicks in.
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

      {/* ── Configuration ── */}
      <Anchor id="configuration" />
      <section>
        <SectionTitle>Configuration</SectionTitle>
        <Prose>
          All configuration lives in <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>toll.config.json</code>,
          validated at startup with Zod. Invalid configs fail fast with clear error messages.
        </Prose>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3.5 text-left font-medium">Field</th>
                <th className="px-5 py-3.5 text-left font-medium">Type</th>
                <th className="px-5 py-3.5 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {([
                ["network", '"testnet" | "mainnet"', "Stellar network to use"],
                ["payTo", "string", "Your Stellar public address (G...)"],
                ["facilitatorUrl", "string", "x402 facilitator URL"],
                ["defaultPaymentMode", '"x402" | "mpp"', "Default protocol for all tools"],
                ["tools", "Record<string, ToolConfig>", "Map of tool names to pricing config"],
                ["tools[].price", "string", 'USDC price per call (e.g. "0.01")'],
                ["tools[].currency", '"USDC"', "Payment currency"],
                ["tools[].paymentMode", '"x402" | "mpp"', "Override default per tool"],
                ["tools[].rateLimit.free", "number", "Free calls before payment required"],
                ["spendingPolicy", "object", "Global spending limits"],
              ] as const).map(([field, type, desc]) => (
                <tr key={field} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-emerald-400">{field}</td>
                  <td className="px-5 py-3 text-gray-500">{type}</td>
                  <td className="px-5 py-3 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>How to price your tools</SubTitle>
        <Prose>
          There is no right answer, but here are guidelines based on what the tool does:
        </Prose>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3 text-left font-medium">Tool type</th>
                <th className="px-5 py-3 text-left font-medium">Suggested price</th>
                <th className="px-5 py-3 text-left font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Health check / status", "Free ($0)", "Builds trust, lets agents verify your server is up"],
                ["Simple lookup / search", "$0.001 - $0.01", "Low cost per call, high volume expected"],
                ["Analysis / processing", "$0.01 - $0.10", "More compute, more value to the caller"],
                ["Complex multi-step", "$0.10 - $1.00", "Significant processing, data access, or API costs"],
              ].map(([type, price, why]) => (
                <tr key={type} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-gray-300 font-medium">{type}</td>
                  <td className="px-5 py-3 text-emerald-400">{price}</td>
                  <td className="px-5 py-3 text-gray-400">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>Spending policies</SubTitle>
        <Prose>
          Protect your server from runaway spending with global limits.
        </Prose>
        <CodeBlock code={`"spendingPolicy": {
  "maxPerCall": "0.10",         // No single call costs more than $0.10
  "maxDailyPerCaller": "1.00",  // Each caller capped at $1/day
  "maxDailyGlobal": "10.00"    // Total daily cap across all callers
}`} language="json" />

        <SubTitle>USDC decimal precision</SubTitle>
        <Prose>
          USDC on Stellar uses 7 decimal places. Toll converts your human-readable prices internally:
        </Prose>
        <CodeBlock code={`"0.01"  USDC  →  100000   base units (stroops)
"0.001" USDC  →  10000    base units
"1.00"  USDC  →  10000000 base units`} language="text" />
      </section>

      <Divider />

      {/* ── Toll Proxy ── */}
      <Anchor id="toll-proxy" />
      <section>
        <SectionTitle>Toll Proxy</SectionTitle>
        <Prose>
          The Toll Proxy lets any MCP client (Claude Desktop, Cursor, etc.) use paid tools without payment code.
          It sits between your client and the Toll-powered server, intercepting 402 responses, auto-signing USDC payments on Stellar, and retrying.
        </Prose>

        <SubTitle>Start the Proxy</SubTitle>
        <CodeBlock code={PROXY_SNIPPET} language="bash" />

        <SubTitle>Connect Your MCP Client</SubTitle>
        <Prose>Add the proxy URL to your MCP client configuration:</Prose>
        <CodeBlock code={PROXY_CONFIG_SNIPPET} language="json" />

        <InfoBox title="Auto Wallet">
          The proxy auto-creates a Stellar Ed25519 keypair at ~/.toll/wallet.json on first run.
          Fund this wallet with USDC to start using paid tools. See the Fund page for options.
        </InfoBox>

        <SubTitle>Budget Controls</SubTitle>
        <Prose>
          The proxy enforces spending limits to prevent runaway costs:
        </Prose>
        <CodeBlock code={`--budget-daily 5.00    # Max $5 USDC per day (default)
--budget-per-call 0.50  # Max $0.50 per individual call`} language="bash" />

        <SubTitle>Hosted Proxy (no install)</SubTitle>
        <Prose>
          Use the hosted proxy at <code className="text-emerald-400">proxy.tollpay.xyz</code> — no install, no wallet setup.
          Just point your MCP client at:
        </Prose>
        <CodeBlock code={`https://proxy.tollpay.xyz/mcp?target=https://api.tollpay.xyz/mcp`} language="bash" filename="hosted proxy URL" />
        <Prose>
          Or self-host with npx for full control over your wallet and budget.
          The proxy is open source and deployable on Railway/Docker.
        </Prose>
      </section>

      <Divider />

      {/* ── Tool Registry ── */}
      <Anchor id="toll-registry" />
      <section>
        <SectionTitle>Tool Registry</SectionTitle>
        <Prose>
          The Toll Registry is a public directory where Toll-powered MCP servers register their tools
          and agents discover them by capability, price, and quality score.
        </Prose>

        <SubTitle>Register Your Server</SubTitle>
        <Prose>From your MCP server project directory (with toll.config.json):</Prose>
        <CodeBlock code={`npx @rajkaria123/toll-cli register --url https://your-server.com/mcp`} language="bash" />
        <Prose>
          Registration is authenticated via Stellar keypair signature. The CLI fetches your server&apos;s tool manifest
          and registers all tools with the registry.
        </Prose>

        <SubTitle>Discover Tools</SubTitle>
        <Prose>Agents and developers can discover tools programmatically:</Prose>
        <CodeBlock code={REGISTRY_SNIPPET} language="typescript" />

        <SubTitle>Quality Scores</SubTitle>
        <Prose>
          Each tool has a quality score (0-100) based on uptime, success rate, latency, and usage volume.
          The Toll Proxy automatically reports metrics to the registry.
          Higher quality scores appear first in discovery results.
        </Prose>
      </section>

      <Divider />

      {/* ── Wallet Management ── */}
      <Anchor id="wallet" />
      <section>
        <SectionTitle>Wallet Management</SectionTitle>
        <Prose>
          The Toll SDK auto-creates and manages Stellar Ed25519 keypairs for agents.
          No manual wallet setup required.
        </Prose>
        <CodeBlock code={WALLET_SNIPPET} language="typescript" />

        <SubTitle>Wallet Storage</SubTitle>
        <Prose>
          Wallets are stored at ~/.toll/wallet.json with 0600 file permissions (owner read/write only).
          The file contains the Stellar public key and secret key.
          Do not store large amounts — this is designed for micropayment budgets.
        </Prose>

        <SubTitle>Funding</SubTitle>
        <Prose>
          Fund your wallet with USDC on Stellar via LOBSTR, MoneyGram, or an exchange.
          See the Fund page for step-by-step instructions.
        </Prose>
      </section>

      <Divider />

      {/* ── Agent SDK ── */}
      <Anchor id="agent-sdk" />
      <section>
        <SectionTitle>Agent SDK</SectionTitle>
        <Prose>
          For AI agents that need to discover and pay for tools automatically.
          The SDK handles 402 detection, USDC signing, request retry, and budget enforcement.
        </Prose>

        <SubTitle>Install</SubTitle>
        <CodeBlock code="npm install @rajkaria123/toll-sdk" language="bash" />

        <SubTitle>Basic usage</SubTitle>
        <CodeBlock code={`import { TollClient } from "@rajkaria123/toll-sdk"

const toll = new TollClient({
  serverUrl: "https://your-server.com",
  secretKey: "S...",  // Stellar Ed25519 secret key
  budget: {
    maxPerCall: "0.10",
    maxDaily: "5.00",
  },
})

// Free tool — no payment
const health = await toll.callTool("health_check")

// Paid tool — auto-handles 402 → sign → retry
const result = await toll.callTool("search_competitors", {
  query: "AI agent frameworks"
})`} language="typescript" />

        <SubTitle>Discover available tools</SubTitle>
        <CodeBlock code={`const manifest = await toll.discoverTools()
// Returns: { tools: [{ name, price, currency, paymentMode }], network }`} language="typescript" />

        <SubTitle>Track spending</SubTitle>
        <CodeBlock code={`const report = toll.getSpending()
// { totalSpent, callCount, byTool, dailyRemaining }`} language="typescript" />

        <SubTitle>Events</SubTitle>
        <CodeBlock code={`toll.on("payment", (ev, data) => console.log(\`Paid \${data.amount} for \${data.tool}\`))
toll.on("budget_warning", (ev, data) => console.log(\`\${data.remaining} remaining\`))
toll.on("error", (ev, data) => console.error(data.error))`} language="typescript" />

        <InfoBox title="Budget safety">
          The SDK enforces hard limits. If a tool call would exceed maxPerCall or maxDaily,
          it returns an error immediately without attempting payment. Autonomous agents cannot overspend.
        </InfoBox>
      </section>

      <Divider />

      {/* ── Earnings & Dashboard ── */}
      <Anchor id="earnings" />
      <section>
        <SectionTitle>Earnings &amp; Dashboard</SectionTitle>
        <Prose>
          Every paid tool call is recorded to a local SQLite database. The dashboard reads this to show
          real-time earnings, per-tool revenue, and per-caller analytics.
        </Prose>

        <SubTitle>Database schema</SubTitle>
        <CodeBlock code={`CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,     -- UUID
  tool        TEXT NOT NULL,        -- tool name
  caller      TEXT,                 -- Stellar address or IP
  amount_usdc REAL NOT NULL,        -- payment amount
  protocol    TEXT NOT NULL,        -- "x402" or "mpp"
  tx_hash     TEXT,                 -- on-chain transaction hash
  created_at  INTEGER NOT NULL      -- Unix timestamp (ms)
);`} language="sql" filename="~/.toll/earnings.db" />

        <SubTitle>API Reference</SubTitle>
        {[
          {
            sig: "tollMiddleware(config: TollConfig): RequestHandler",
            pkg: "@rajkaria123/toll-gateway",
            desc: "Express middleware. Place before your MCP transport handler. Intercepts tools/call requests, enforces payment.",
            example: `import { tollMiddleware, loadConfig } from "@rajkaria123/toll-gateway"\nconst config = loadConfig("./toll.config.json")\napp.use("/mcp", tollMiddleware(config))`,
          },
          {
            sig: "loadConfig(path: string): TollConfig",
            pkg: "@rajkaria123/toll-gateway",
            desc: "Reads and validates toll.config.json. Throws with clear errors on invalid config.",
            example: `const config = loadConfig("./toll.config.json")\nconsole.log(config.tools) // { tool_name: { price, currency } }`,
          },
          {
            sig: "new EarningsTracker(dataDir?: string)",
            pkg: "@rajkaria123/toll-stellar",
            desc: "SQLite-backed payment recorder. Auto-creates DB. Default directory: ~/.toll",
            example: `const tracker = new EarningsTracker("./data")\ntracker.record({ tool: "search", caller: "GABCD...", amountUsdc: 0.01, protocol: "x402", txHash: "abc..." })\ntracker.getStats()    // { totalEarnings, totalCalls }\ntracker.getByTool()   // [{ tool, calls, revenue }]`,
          },
          {
            sig: "new X402Verifier(config: TollConfig)",
            pkg: "@rajkaria123/toll-stellar",
            desc: "Builds 402 responses and verifies payments via the facilitator.",
            example: `const verifier = new X402Verifier(config)\nconst req = verifier.buildRequirements("tool", "0.01", resourceUrl)\nconst result = await verifier.settle(paymentHeader, req)`,
          },
        ].map((api) => (
          <div key={api.sig} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h4 className="text-xs font-semibold text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {api.sig}
              </h4>
              <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {api.pkg}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{api.desc}</p>
            <CodeBlock code={api.example} language="typescript" />
          </div>
        ))}

        <SubTitle>Environment variables</SubTitle>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3 text-left font-medium">Variable</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {[
                ["PORT", "Server port (default: 3002)"],
                ["TOLL_SERVER_SECRET", "Stellar secret key for payment signing"],
                ["TOLL_SERVER_ADDRESS", "Stellar public key (must match payTo)"],
                ["TOLL_DATA_DIR", "SQLite directory (default: ~/.toll)"],
                ["X402_FACILITATOR_URL", "x402 facilitator endpoint"],
                ["TOLL_EARNINGS_API_URL", "Remote earnings API for split deployments"],
              ].map(([name, desc]) => (
                <tr key={name} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-emerald-400">{name}</td>
                  <td className="px-5 py-3 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Divider />

      {/* ── Security ── */}
      <Anchor id="security" />
      <section>
        <SectionTitle>Security</SectionTitle>

        <div className="space-y-4">
          {[
            { title: "On-chain payment verification", desc: "Every x402 payment is verified on Stellar mainnet via the OpenZeppelin facilitator. Toll never trusts client claims without on-chain proof." },
            { title: "Replay protection", desc: "Payment signatures are cached and rejected on reuse. Each signature has a 5-minute TTL. The same payment cannot be used twice." },
            { title: "Spending policies", desc: "Per-call caps, daily per-caller budgets, and global daily limits. Enforced before payment is even attempted." },
            { title: "Input validation", desc: "All config validated with Zod at startup. Tool names are validated against alphanumeric pattern. Invalid requests are rejected immediately." },
            { title: "Middleware ordering", desc: "tollMiddleware runs before the MCP transport. There is no way to bypass the payment check and reach your tool code without paying." },
            { title: "Key isolation", desc: "Server secret keys go in .env only. The config file contains only the public payTo address. No keys are logged or exposed." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── FAQ & Troubleshooting ── */}
      <Anchor id="faq" />
      <section>
        <SectionTitle>FAQ &amp; Troubleshooting</SectionTitle>

        <div className="space-y-4">
          <FaqItem q="How do I get a Stellar address?">
            <p>Generate a keypair using Stellar SDK or the Toll setup script. For mainnet, fund it with a small amount of XLM (2 XLM minimum) and add a USDC trustline. You can acquire XLM from any major exchange.</p>
          </FaqItem>

          <FaqItem q="What if an agent doesn't have an x402-compatible wallet?">
            <p>The agent will receive a 402 response but won&apos;t be able to pay. Free tools still work. For paid tools, the agent needs the <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">@rajkaria123/toll-sdk</code> or any x402-compatible client with a funded Stellar wallet.</p>
          </FaqItem>

          <FaqItem q="Can I change prices after deployment?">
            <p>Yes. Update <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">toll.config.json</code> and restart your server. Price changes take effect immediately. There is no migration needed.</p>
          </FaqItem>

          <FaqItem q="How do I get my earnings out?">
            <p>Earnings are USDC in your Stellar wallet. You can send USDC to any exchange that supports Stellar USDC (Coinbase, Kraken, etc.) and convert to fiat. The funds are yours immediately &mdash; there is no holding period.</p>
          </FaqItem>

          <FaqItem q="Does Toll take a cut?">
            <p>Currently, no. 100% of each payment goes to your <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">payTo</code> address. The only cost is the Stellar transaction fee (~$0.00001 per transaction), paid by the agent.</p>
          </FaqItem>

          <FaqItem q="The playground shows 402 but my tool doesn't execute">
            <p>This is expected. A 402 response means the payment gate is working correctly. The tool will only execute after the agent signs a USDC payment and retries with a valid <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">payment-signature</code> header.</p>
          </FaqItem>

          <FaqItem q="Can I use Toll with a non-Express server?">
            <p>Toll is currently Express middleware. For other frameworks (Hono, Fastify, etc.), you can adapt the middleware or use the <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">withToll()</code> wrapper which works with stdio-based MCP servers independent of HTTP framework.</p>
          </FaqItem>

          <FaqItem q="Is MPP production-ready?">
            <p>MPP integration is experimental. The x402 protocol is fully production-ready and recommended for most use cases. MPP support will be fully validated as the Stellar MPP SDK stabilizes.</p>
          </FaqItem>

          <FaqItem q="How do I deploy?">
            <p>Deploy your MCP server anywhere Node.js runs (Railway, Fly.io, AWS, etc.). The dashboard deploys to Vercel. Set <code className="text-emerald-400 bg-white/5 px-1 rounded text-xs">TOLL_EARNINGS_API_URL</code> on Vercel to connect the dashboard to your server&apos;s earnings API if they&apos;re on different hosts.</p>
          </FaqItem>

          <FaqItem q="What are the known limitations?">
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Rate limiter is in-memory (resets on server restart)</li>
              <li>SQLite earnings DB works for single-server deployments</li>
              <li>Streaming payment support is not yet available</li>
              <li>Express-only middleware (other frameworks need adapters)</li>
            </ul>
          </FaqItem>
        </div>
      </section>

      <Divider />

      {/* ── On-Chain Proof ── */}
      <Anchor id="transactions" />
      <section>
        <SectionTitle>On-Chain Transaction Proof</SectionTitle>
        <Prose>
          All transactions below are on <strong className="text-white">Stellar Mainnet</strong> with <strong className="text-white">real USDC</strong>.
          Every link goes to Stellar Expert, the public block explorer. Independently verifiable by anyone.
        </Prose>

        <InfoBox title="Summary">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <span>Total on-chain transactions</span><span className="text-white font-semibold">21+</span>
            <span>x402 USDC settlements (Soroban)</span><span className="text-white font-semibold">11</span>
            <span>USDC payments</span><span className="text-white font-semibold">3</span>
            <span>Account creations</span><span className="text-white font-semibold">3</span>
            <span>Total USDC settled</span><span className="text-white font-semibold">~$0.53</span>
            <span>Settlement</span><span className="text-white font-semibold">Self-hosted Soroban</span>
          </div>
        </InfoBox>

        <SubTitle>Wallets</SubTitle>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-left font-medium">Address</th>
                <th className="px-5 py-3 text-left font-medium">Balance</th>
                <th className="px-5 py-3 text-left font-medium">Explorer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: "Server", addr: "GDQRUDNV3D3DF3KMVPWHFW7Y676AEPL7U6CEXKCD2F7HLEPFF5HKOEUV", bal: "1.24 USDC" },
                { role: "Agent 1", addr: "GCW4WEKHK46CNNSGHAIBF4JWG7HSPIAD4T5MJJ76FL3SKHDFFMREJZK7", bal: "0.15 USDC" },
                { role: "Agent 2", addr: "GDLX6OYXSTUOACDRMCFH6TE3NB7LT3QMWW4F73OO6G6TKPDX44ZO3YHE", bal: "0.14 USDC" },
              ].map((w) => (
                <tr key={w.role} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-gray-300 font-medium">{w.role}</td>
                  <td className="px-5 py-3 text-emerald-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {w.addr.slice(0, 8)}...{w.addr.slice(-8)}
                  </td>
                  <td className="px-5 py-3 text-white font-semibold">{w.bal}</td>
                  <td className="px-5 py-3">
                    <a href={`https://stellar.expert/explorer/public/account/${w.addr}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">View &rarr;</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>What Was Achieved</SubTitle>
        <div className="space-y-4 my-4">
          {[
            { title: "End-to-End x402 Payment Flow on Mainnet", desc: "Agent calls tool -> Toll returns HTTP 402 -> Agent signs USDC payment -> Server settles via Soroban -> Tool executes. Real USDC, real blockchain." },
            { title: "Self-Hosted Settlement", desc: "Toll submits Soroban transactions directly using its own Stellar keypair. No dependency on external facilitators." },
            { title: "Multiple Agent Wallets", desc: "Two independent agent wallets successfully paid for tool calls, demonstrating multi-tenant capability." },
            { title: "USDC Trustline Auto-Setup", desc: "Full wallet lifecycle: account creation, USDC trustline, funding, payment signing, and settlement." },
            { title: "Sub-Second Settlement", desc: "All Soroban contract invocations settle in 3-5 seconds on Stellar mainnet." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <SubTitle>x402 USDC Settlements (Soroban)</SubTitle>
        <Prose>
          Each row is an <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>invoke_host_function</code> operation
          that transfers USDC via the Soroban USDC SAC contract.
        </Prose>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Time (UTC)</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Agent</th>
                <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {[
                { n: 1, time: "Apr 11 07:23", amt: "0.01", agent: "1", hash: "e8f55b6814c984a61f43d7f8e13baff544dadd0adad35d3d7a8beb739b3d986d" },
                { n: 2, time: "Apr 12 04:40", amt: "0.01", agent: "1", hash: "75eb38cab324ddd210b0917ac2a3e8dc4964a09736a931a8b9fa272677c1de1e" },
                { n: 3, time: "Apr 12 04:44", amt: "0.01", agent: "1", hash: "82342ebec33f03515632520b72deba6ce03b7a8ac393a8323b5a0ec396511bcd" },
                { n: 4, time: "Apr 12 04:45", amt: "0.01", agent: "1", hash: "737545dd086959044d16a0ee4f947f2daf0ebdd9cb316028b23f87e2995e1926" },
                { n: 5, time: "Apr 12 04:46", amt: "0.01", agent: "1", hash: "0e3ac945c9ecccb1fcd6476364f574668bba3e3edd5d478c6b0441e733bafd58" },
                { n: 6, time: "Apr 12 05:32", amt: "0.01", agent: "2", hash: "25f3dfb9ffd77e0986f63c0bfe6178451307a5912a65a8c666054d04a896b8f0" },
                { n: 7, time: "Apr 12 05:32", amt: "0.01", agent: "2", hash: "2d6ea847737747c97b3b1a82dab09cba452869a76f2cf29b8c14de399e926bb9" },
                { n: 8, time: "Apr 12 05:32", amt: "0.01", agent: "2", hash: "015ef6bacf0520d567fa3cac44a7135ff4152fda79ee72d2e49a1f8670081099" },
                { n: 9, time: "Apr 12 05:32", amt: "0.01", agent: "2", hash: "ff7902aa90af17cca88ffc454b04d166234c2c3dfc02563a57e0631b2337244e" },
                { n: 10, time: "Apr 12 05:33", amt: "0.01", agent: "2", hash: "8e707a0d4361842b8a3d2110426ae24472c3bb7f167fd9f0c5f8009f1a41cbc2" },
                { n: 11, time: "Apr 12 05:33", amt: "0.01", agent: "2", hash: "048fd865172d4eae1b6b7d543f37f517f6389588268ca5d6382fdd829b833adf" },
              ].map((tx) => (
                <tr key={tx.n} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 text-gray-500">{tx.n}</td>
                  <td className="px-4 py-2.5 text-gray-400">{tx.time}</td>
                  <td className="px-4 py-2.5 text-emerald-400">${tx.amt}</td>
                  <td className="px-4 py-2.5 text-gray-400">Agent {tx.agent}</td>
                  <td className="px-4 py-2.5">
                    <a href={`https://stellar.expert/explorer/public/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                      {tx.hash.slice(0, 12)}...
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>USDC Payments & Account Setup</SubTitle>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-4 py-3 text-left font-medium">Time (UTC)</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
                <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {[
                { time: "Apr 11 07:23", type: "create_account", detail: "Server wallet", hash: "2f165f4ad7f9ef3927d8e4ada15455ad9dfa365093d6fc2118afa57a1561e326" },
                { time: "Apr 11 07:25", type: "trustline + fund", detail: "Server USDC setup", hash: "bbc1dda4971a5b4a9695ef72779389b5a358f2ff41e75c84a71174d073876517" },
                { time: "Apr 12 03:08", type: "create_account", detail: "Agent 1 wallet", hash: "66793cb66d8f67d796ff023aab6d03eb22dbb01af79521ba8d5e9f85ffa05f19" },
                { time: "Apr 12 03:08", type: "change_trust", detail: "Agent 1 USDC", hash: "c3a578eb3f047d4f057dbef5add9fa73be67257ae5c699e16c21039193542ae0" },
                { time: "Apr 12 03:08", type: "payment", detail: "0.20 USDC to Agent 1", hash: "26872672c2771413587ef6971f7adf006b1cdef81aca6e88afeeb6c5398505b1" },
                { time: "Apr 12 03:09", type: "payment", detail: "0.01 USDC Agent 1 -> Server", hash: "d8b1c8ca5413fd0ba84b7701dd2c3fb87aa065667eaaa8c0f5a936d1858fe33b" },
                { time: "Apr 12 05:26", type: "create_account", detail: "Agent 2 wallet", hash: "3fe2eac0f11aec34a35a07956299e0c5399b174f3770c025ca653d983598761e" },
                { time: "Apr 12 05:29", type: "change_trust", detail: "Agent 2 USDC", hash: "7e57a202e27b4b56c5a6f56e7e5b430698e85ccec00c7995c53c5791ebcbcf9a" },
                { time: "Apr 12 05:29", type: "payment", detail: "0.20 USDC to Agent 2", hash: "0286dbb3987b839ea59f4688294ca73f665b24d46159030296aa8d957a4e13a4" },
              ].map((tx) => (
                <tr key={tx.hash} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 text-gray-400">{tx.time}</td>
                  <td className="px-4 py-2.5 text-gray-300 font-medium">{tx.type}</td>
                  <td className="px-4 py-2.5 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>{tx.detail}</td>
                  <td className="px-4 py-2.5">
                    <a href={`https://stellar.expert/explorer/public/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                      {tx.hash.slice(0, 12)}...
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>Timeline</SubTitle>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden my-4">
          <table className="w-full text-xs">
            <tbody>
              {[
                ["Apr 11 07:23", "Server wallet created and funded on Stellar mainnet"],
                ["Apr 11 07:23", "First x402 USDC settlement on mainnet (Soroban)"],
                ["Apr 12 03:08", "Agent 1 wallet created, trustline added, funded"],
                ["Apr 12 03:09", "First agent-to-server USDC payment"],
                ["Apr 12 04:40", "Self-hosted settlement working (no external facilitator)"],
                ["Apr 12 05:26", "Agent 2 (proxy) wallet auto-created"],
                ["Apr 12 05:32", "6 consecutive x402 settlements from Agent 2"],
              ].map(([date, event]) => (
                <tr key={date + event} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-emerald-400 font-medium whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{date}</td>
                  <td className="px-5 py-3 text-gray-300">{event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle>How to Verify</SubTitle>
        <Prose>
          Click any transaction link to see it on{" "}
          <a href="https://stellar.expert/explorer/public/account/GDQRUDNV3D3DF3KMVPWHFW7Y676AEPL7U6CEXKCD2F7HLEPFF5HKOEUV" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2">Stellar Expert</a>.
          All data is independently verifiable via the Stellar Horizon API.
        </Prose>
        <CodeBlock code={`# Check server account transactions
curl https://horizon.stellar.org/accounts/GDQRUDNV3D3DF3KMVPWHFW7Y676AEPL7U6CEXKCD2F7HLEPFF5HKOEUV/operations?order=desc&limit=20

# Or try a paid tool yourself (returns HTTP 402)
curl -X POST https://api.tollpay.xyz/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_competitors","arguments":{"query":"test"}}}'`} language="bash" />
      </section>

        </div>{/* end Content */}
      </div>{/* end flex */}
    </main>
  )
}
