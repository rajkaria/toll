#!/usr/bin/env npx tsx
/**
 * TollPay Demo Agent
 *
 * Demonstrates the full x402 payment flow:
 *   1. Call a FREE tool (health_check) — no payment needed
 *   2. Call a PAID tool (search_competitors, $0.01 USDC) — 402 -> sign -> retry -> result
 *   3. Print spending summary with Stellar transaction details
 *
 * Usage:
 *   AGENT_SECRET_KEY=S... npx tsx scripts/demo-agent.ts
 *
 * The AGENT_SECRET_KEY must be a Stellar secret key for an account
 * funded with USDC on Stellar mainnet.
 */

import { TollClient } from "../packages/sdk/src/client.js"
import type { ToolCallResult, SpendingReport } from "../packages/sdk/src/types.js"

// ── Configuration ──────────────────────────────────────────────────────────

const SERVER_URL = "https://api.tollpay.xyz"
const SECRET_KEY = process.env.AGENT_SECRET_KEY

// ── ANSI helpers ───────────────────────────────────────────────────────────

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`

function separator() {
  console.log(dim("━".repeat(50)))
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("")
  console.log(bold("🤖 TollPay Demo Agent"))
  console.log(dim("━".repeat(50)))
  console.log("")
  console.log(`  Server:  ${cyan(SERVER_URL)}`)
  console.log(`  Wallet:  ${SECRET_KEY ? green("configured") : yellow("not set")}`)
  console.log("")

  if (!SECRET_KEY) {
    console.log(red("ERROR: AGENT_SECRET_KEY environment variable is required."))
    console.log(dim("  This must be a Stellar secret key (starts with S...)"))
    console.log(dim("  for an account funded with USDC on Stellar mainnet."))
    console.log("")
    console.log(dim("  Usage: AGENT_SECRET_KEY=S... npx tsx scripts/demo-agent.ts"))
    console.log("")
    process.exit(1)
  }

  // Initialize TollClient with budget guard
  const toll = new TollClient({
    serverUrl: SERVER_URL,
    secretKey: SECRET_KEY,
    autoRetry: true,
    budget: {
      maxPerCall: "1.00",   // max $1 per call (safety)
      maxDaily: "5.00",     // max $5/day (safety)
    },
  })

  // Listen for events to show real-time feedback
  toll.on((event, data) => {
    if (event === "payment") {
      console.log(green(`  💰 Payment signed & settled via ${data.protocol} — $${data.amount} USDC`))
    }
    if (event === "error") {
      console.log(red(`  ❌ Error: ${data.error}`))
    }
    if (event === "budget_warning") {
      console.log(yellow(`  ⚠️  Budget warning: ${data.reason}`))
    }
  })

  // ── Step 1: Discover available tools ─────────────────────────────────────

  console.log(bold("Step 0: Discovering available tools..."))
  try {
    const manifest = await toll.discoverTools()
    console.log(green(`  ✅ Found ${manifest.count} tools on ${manifest.network}:`))
    for (const tool of manifest.tools) {
      const price = tool.free ? "FREE" : `$${tool.price} ${tool.currency}`
      console.log(dim(`     • ${tool.name} — ${price}`))
    }
  } catch (err) {
    console.log(yellow(`  ⚠️  Could not discover tools: ${err}`))
  }
  console.log("")

  // ── Step 2: Call FREE tool (health_check) ────────────────────────────────

  separator()
  console.log(bold("Step 1: Calling FREE tool (health_check)..."))
  console.log("")

  const healthResult = await toll.callTool("health_check", {})

  if (healthResult.success) {
    const data = extractToolResponse(healthResult)
    console.log(green(`  ✅ Free tool returned:`))
    console.log(cyan(`     ${JSON.stringify(data, null, 2).split("\n").join("\n     ")}`))
  } else {
    console.log(red(`  ❌ Failed: ${healthResult.error}`))
  }
  console.log("")

  // ── Step 3: Call PAID tool (search_competitors, $0.01 USDC) ──────────────

  separator()
  console.log(bold("Step 2: Calling PAID tool (search_competitors, $0.01 USDC)..."))
  console.log(dim("  → First request will get HTTP 402 Payment Required"))
  console.log(dim("  → TollClient auto-signs USDC payment on Stellar"))
  console.log(dim("  → Retries with x402 payment header"))
  console.log("")

  const searchResult = await toll.callTool("search_competitors", {
    query: "AI agent frameworks",
  })

  if (searchResult.success) {
    console.log(green(`  ✅ Tool returned successfully!`))
    console.log(dim(`     Paid: ${searchResult.paid ? `$${searchResult.amount} USDC via ${searchResult.protocol}` : "no"}`))
    if (searchResult.txHash) {
      console.log(cyan(`     🔗 TX: ${searchResult.txHash}`))
      console.log(dim(`     Verify: https://stellar.expert/explorer/public/tx/${searchResult.txHash}`))
    }
    const data = extractToolResponse(searchResult)
    if (data) {
      const preview = JSON.stringify(data, null, 2)
      const lines = preview.split("\n")
      const shown = lines.slice(0, 12).join("\n     ")
      console.log(dim(`     Response preview:`))
      console.log(dim(`     ${shown}`))
      if (lines.length > 12) {
        console.log(dim(`     ... (${lines.length - 12} more lines)`))
      }
    }
  } else {
    console.log(red(`  ❌ Failed: ${searchResult.error}`))
    if (!searchResult.paid && searchResult.amount) {
      console.log(yellow(`     Price was: $${searchResult.amount} USDC`))
    }
  }
  console.log("")

  // ── Spending Summary ─────────────────────────────────────────────────────

  separator()
  console.log(bold("📊 Spending Summary"))
  console.log("")

  const spending: SpendingReport = toll.getSpending()

  for (const [tool, info] of Object.entries(spending.byTool)) {
    if (info.spent === 0) {
      console.log(`  ${tool}: ${green("FREE")}`)
    } else {
      console.log(`  ${tool}: ${yellow(`$${info.spent.toFixed(2)} USDC`)} (${info.calls} call${info.calls > 1 ? "s" : ""})`)
    }
  }

  console.log("")
  console.log(bold(`  Total: $${spending.totalSpent.toFixed(2)} USDC`))
  console.log(dim(`  Calls: ${spending.callCount}`))

  if (spending.dailyBudget) {
    console.log(dim(`  Daily budget remaining: $${spending.dailyRemaining?.toFixed(2)} / $${spending.dailyBudget.toFixed(2)}`))
  }

  if (searchResult.txHash) {
    console.log("")
    console.log(bold("🔗 Stellar Transaction"))
    console.log(cyan(`  ${searchResult.txHash}`))
    console.log(dim(`  https://stellar.expert/explorer/public/tx/${searchResult.txHash}`))
  }

  console.log("")
  separator()
  console.log(green(bold("✅ Demo complete!")))
  console.log("")
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the tool response from the MCP JSON-RPC result.
 * The TollClient returns the parsed SSE/JSON body which wraps
 * the actual content in result.content[0].text.
 */
function extractToolResponse(callResult: ToolCallResult): unknown {
  const data = callResult.data as Record<string, unknown> | undefined
  if (!data) return null

  // MCP JSON-RPC envelope: { result: { content: [{ type: "text", text: "..." }] } }
  const result = data.result as Record<string, unknown> | undefined
  const content = result?.content as Array<{ type: string; text: string }> | undefined
  if (content?.[0]?.text) {
    try {
      return JSON.parse(content[0].text)
    } catch {
      return content[0].text
    }
  }

  // Direct content array (some responses)
  const directContent = data.content as Array<{ type: string; text: string }> | undefined
  if (directContent?.[0]?.text) {
    try {
      return JSON.parse(directContent[0].text)
    } catch {
      return directContent[0].text
    }
  }

  return data
}

// ── Run ────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(red(`\n❌ Fatal error: ${err.message || err}`))
  if (err.stack) console.error(dim(err.stack))
  process.exit(1)
})
