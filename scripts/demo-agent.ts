/**
 * Toll Demo Agent
 *
 * Demonstrates calling monetized MCP tools with automatic x402 payments.
 * Set environment variables before running:
 *   AGENT_SECRET_KEY=S...  (Stellar secret key for paying)
 *   SERVER_URL=http://localhost:3002  (optional, defaults shown)
 */
import { createEd25519Signer, USDC_TESTNET_ADDRESS } from "@x402/stellar"
import { x402Client, x402HTTPClient } from "@x402/core/client"
import { ExactStellarScheme } from "@x402/stellar"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3002"
const MCP_ENDPOINT = `${SERVER_URL}/mcp`
const SECRET_KEY = process.env.AGENT_SECRET_KEY

function bold(s: string) {
  return `\x1b[1m${s}\x1b[0m`
}
function green(s: string) {
  return `\x1b[32m${s}\x1b[0m`
}
function yellow(s: string) {
  return `\x1b[33m${s}\x1b[0m`
}
function red(s: string) {
  return `\x1b[31m${s}\x1b[0m`
}
function dim(s: string) {
  return `\x1b[2m${s}\x1b[0m`
}

/** Encode a PaymentPayload into the payment-signature header value */
function encodePaymentSignature(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

interface McpCallResult {
  paid: boolean
  protocol?: string
  txHash?: string
  result?: unknown
  error?: string
}

async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  httpClient: x402HTTPClient | null
): Promise<McpCallResult> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  })

  // First attempt — no payment header
  const resp1 = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })

  if (resp1.status === 200) {
    const data = await resp1.json()
    return { paid: false, result: data }
  }

  if (resp1.status === 402) {
    if (!httpClient) {
      const errBody = await resp1.json()
      return { paid: false, error: `Payment required but no wallet configured: ${JSON.stringify(errBody)}` }
    }

    const respBody = await resp1.json()

    // Extract PaymentRequired from the response body header field
    const paymentRequired = httpClient.getPaymentRequiredResponse(
      (name) => resp1.headers.get(name),
      respBody
    )

    // Create payment payload
    let paymentPayload: unknown
    try {
      paymentPayload = await httpClient.createPaymentPayload(paymentRequired)
    } catch (e) {
      return { paid: false, error: `Failed to create payment: ${e}` }
    }

    // Encode the payment header
    const sigHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload as Parameters<typeof httpClient.encodePaymentSignatureHeader>[0])

    // Retry with payment signature
    const resp2 = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...sigHeaders,
      },
      body,
    })

    if (resp2.status === 200) {
      const data = await resp2.json()
      const settleResp = httpClient.getPaymentSettleResponse((name) => resp2.headers.get(name))
      return {
        paid: true,
        protocol: "x402",
        txHash: (settleResp as Record<string, unknown>)?.transaction as string | undefined,
        result: data,
      }
    }

    const errBody = await resp2.json()
    return { paid: false, error: `Payment retry failed (${resp2.status}): ${JSON.stringify(errBody)}` }
  }

  return { paid: false, error: `Unexpected status ${resp1.status}` }
}

function printResult(callResult: McpCallResult) {
  if (callResult.error) {
    console.log(red(`  ✗ Error: ${callResult.error}`))
    return
  }
  if (callResult.paid) {
    console.log(green(`  ✓ Payment sent via ${callResult.protocol?.toUpperCase()}`))
    if (callResult.txHash) {
      console.log(dim(`    tx: ${callResult.txHash}`))
    }
  } else {
    console.log(green(`  ✓ Free (no payment required)`))
  }
  const result = callResult.result as Record<string, unknown>
  const content = (result?.result as Record<string, unknown>)?.content as Array<{ text: string }> | undefined
  if (content?.[0]?.text) {
    try {
      const parsed = JSON.parse(content[0].text)
      console.log(dim(`  Response: ${JSON.stringify(parsed, null, 2).split("\n").slice(0, 8).join("\n  ")}`))
    } catch {
      console.log(dim(`  Response: ${content[0].text.slice(0, 200)}`))
    }
  }
}

async function main() {
  console.log(bold("\n=== Toll Demo Agent — MCP Payment Gateway ===\n"))
  console.log(`Server: ${SERVER_URL}`)

  // Set up x402 client if wallet provided
  let httpClient: x402HTTPClient | null = null

  if (SECRET_KEY) {
    console.log(green("Wallet configured — x402 payments enabled\n"))
    const signer = createEd25519Signer(SECRET_KEY)
    const stellarScheme = ExactStellarScheme
    const client = x402Client.fromConfig({
      schemes: [
        {
          network: "stellar:testnet",
          client: await stellarScheme.createClient({
            signer,
            assetAddress: USDC_TESTNET_ADDRESS,
          }),
        },
      ],
    })
    httpClient = new x402HTTPClient(client)
  } else {
    console.log(yellow("No AGENT_SECRET_KEY set — paid calls will show 402 without paying\n"))
  }

  // ── Tool 1: health_check (FREE) ────────────────────────────────────────────
  console.log(bold("1. health_check") + " (FREE)")
  const health = await callMcpTool("health_check", {}, httpClient)
  printResult(health)

  // ── Tool 2: search_competitors ($0.01 x402) ────────────────────────────────
  console.log(bold("\n2. search_competitors") + " ($0.01 USDC via x402)")
  const search = await callMcpTool("search_competitors", { query: "project management tools" }, httpClient)
  printResult(search)

  // ── Tool 3: analyze_sentiment ($0.02 x402) ─────────────────────────────────
  console.log(bold("\n3. analyze_sentiment") + " ($0.02 USDC via x402 + Claude AI)")
  const sentiment = await callMcpTool(
    "analyze_sentiment",
    { url: "https://example.com" },
    httpClient
  )
  printResult(sentiment)

  // ── Tool 4: compare_products ($0.05 MPP) ──────────────────────────────────
  console.log(bold("\n4. compare_products") + " ($0.05 USDC via MPP)")
  console.log(dim("  Note: MPP payments require the full Stellar MPP client stack"))
  const compare = await callMcpTool(
    "compare_products",
    { product_a: "GitHub", product_b: "GitLab" },
    httpClient
  )
  printResult(compare)

  console.log(bold("\n=== Done ===\n"))
}

main().catch((err) => {
  console.error(red(`Fatal: ${err.message}`))
  process.exit(1)
})
