import { Command } from "commander"
import express from "express"
import cors from "cors"
import { WalletManager } from "@rajkaria123/toll-sdk"
import { createProxyHandler } from "./proxy.js"
import { ProxyBudgetTracker } from "./budget.js"
import { MetricsCollector } from "./metrics.js"

const program = new Command()

program
  .name("toll-proxy")
  .description("Toll Proxy — auto-pay for MCP tool calls on Stellar")
  .version("0.1.0")
  .option("-t, --target <url>", "Default target MCP server URL", process.env.TOLL_TARGET)
  .option("-k, --key <secret>", "Stellar secret key (S...)")
  .option("-p, --port <port>", "Port to listen on", "3010")
  .option("--budget-daily <amount>", "Max USDC per day", "5.00")
  .option("--budget-per-call <amount>", "Max USDC per call", "0.50")
  .option("--registry <url>", "Toll registry URL", "https://tollpay.xyz")
  .action(async (opts) => {
    const port = parseInt(opts.port, 10)

    // Get or create wallet
    let secretKey = opts.key ?? process.env.TOLL_SECRET_KEY
    const walletMgr = new WalletManager()

    if (!secretKey) {
      const wallet = walletMgr.getOrCreate("mainnet")
      secretKey = wallet.secretKey
      console.log(`  Wallet: ${wallet.publicKey}`)
      console.log(`  ${walletMgr.fundingInstructions(wallet.publicKey)}`)
    } else {
      // Derive public key from secret
      const { Keypair } = await import("@stellar/stellar-sdk")
      console.log(`  Wallet: ${Keypair.fromSecret(secretKey).publicKey()}`)
    }

    const budget = new ProxyBudgetTracker({
      maxPerCall: opts.budgetPerCall,
      maxDaily: opts.budgetDaily,
    })

    const metrics = new MetricsCollector(opts.registry)
    metrics.startPeriodicFlush()

    const app = express()
    app.use(cors())
    app.use(express.json())

    // Proxy endpoint
    app.post("/mcp", createProxyHandler({
      secretKey,
      defaultTarget: opts.target,
      budget,
      metrics,
    }))

    // Status endpoint
    app.get("/status", (_req, res) => {
      res.json({
        status: "running",
        proxy: "toll-proxy",
        version: "0.1.0",
        defaultTarget: opts.target ?? null,
        budget: budget.getReport(),
      })
    })

    // Discovery passthrough
    app.get("/discover", async (req, res) => {
      try {
        const params = new URLSearchParams(req.query as Record<string, string>)
        const resp = await fetch(`${opts.registry}/api/registry/discover?${params}`)
        const data = await resp.json()
        res.json(data)
      } catch {
        res.status(502).json({ error: "Registry unavailable" })
      }
    })

    app.listen(port, () => {
      console.log(`\n  Toll Proxy running on http://localhost:${port}`)
      console.log(`  Budget: $${opts.budgetDaily}/day, $${opts.budgetPerCall}/call`)
      if (opts.target) {
        console.log(`  Default target: ${opts.target}`)
        console.log(`\n  Claude Desktop config:`)
        console.log(`  {`)
        console.log(`    "mcpServers": {`)
        console.log(`      "tools": {`)
        console.log(`        "url": "http://localhost:${port}/mcp"`)
        console.log(`      }`)
        console.log(`    }`)
        console.log(`  }`)
      } else {
        console.log(`\n  Use: http://localhost:${port}/mcp?target=https://api.example.com/mcp`)
      }
      console.log()
    })
  })

program.parse()
