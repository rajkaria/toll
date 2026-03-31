/**
 * Stellar Testnet Wallet Setup
 *
 * Creates or loads Stellar keypairs for server and agent, funds them via
 * Friendbot, and prints the .env configuration.
 *
 * Usage: pnpm tsx scripts/setup-wallet.ts
 */
import { Keypair } from "@stellar/stellar-sdk"

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org"

async function friendbot(publicKey: string): Promise<void> {
  const url = `https://friendbot.stellar.org?addr=${publicKey}`
  const resp = await fetch(url)
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Friendbot failed for ${publicKey}: ${text}`)
  }
}

async function getBalance(publicKey: string): Promise<string> {
  const url = `${HORIZON_TESTNET}/accounts/${publicKey}`
  const resp = await fetch(url)
  if (!resp.ok) return "0"
  const data = (await resp.json()) as { balances: Array<{ asset_type: string; asset_code?: string; balance: string }> }
  const xlm = data.balances.find((b) => b.asset_type === "native")
  return xlm?.balance ?? "0"
}

function bold(s: string) { return `\x1b[1m${s}\x1b[0m` }
function green(s: string) { return `\x1b[32m${s}\x1b[0m` }
function yellow(s: string) { return `\x1b[33m${s}\x1b[0m` }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m` }

async function main() {
  console.log(bold("\n=== Toll Testnet Wallet Setup ===\n"))

  // Generate server keypair
  const serverKeypair = Keypair.random()
  console.log(bold("Server wallet (receives payments):"))
  console.log(`  Public:  ${green(serverKeypair.publicKey())}`)
  console.log(`  Secret:  ${yellow(serverKeypair.secret())}`)

  // Generate agent keypair
  const agentKeypair = Keypair.random()
  console.log(bold("\nAgent wallet (sends payments):"))
  console.log(`  Public:  ${green(agentKeypair.publicKey())}`)
  console.log(`  Secret:  ${yellow(agentKeypair.secret())}`)

  console.log("\nFunding wallets via Friendbot...")
  try {
    await Promise.all([
      friendbot(serverKeypair.publicKey()),
      friendbot(agentKeypair.publicKey()),
    ])
    console.log(green("✓ Both wallets funded with 10,000 XLM"))
  } catch (e) {
    console.error(`Friendbot error: ${e}`)
    console.log(yellow("⚠ Could not fund via Friendbot. Fund manually at https://laboratory.stellar.org/#account-creator"))
  }

  // Check balance
  try {
    const [serverBal, agentBal] = await Promise.all([
      getBalance(serverKeypair.publicKey()),
      getBalance(agentKeypair.publicKey()),
    ])
    console.log(dim(`  Server balance: ${serverBal} XLM`))
    console.log(dim(`  Agent balance:  ${agentBal} XLM`))
  } catch {
    // ignore
  }

  console.log(bold("\n=== Add to apps/demo-server/.env ==="))
  console.log(`
PORT=3002
TOLL_SERVER_SECRET=${serverKeypair.secret()}
TOLL_SERVER_ADDRESS=${serverKeypair.publicKey()}
ANTHROPIC_API_KEY=sk-ant-...
TOLL_DATA_DIR=~/.toll
X402_FACILITATOR_URL=https://x402-facilitator.stellar.org
`)

  console.log(bold("=== Also update toll.config.json ==="))
  console.log(`  "payTo": "${serverKeypair.publicKey()}"`)

  console.log(bold("\n=== Agent environment (for demo-agent.ts) ==="))
  console.log(`export AGENT_SECRET_KEY=${agentKeypair.secret()}`)

  console.log(bold("\n⚠  Add USDC to agent wallet via: https://laboratory.stellar.org/#txbuilder"))
  console.log(dim("   The agent needs USDC (testnet) to pay for tool calls.\n"))
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`)
  process.exit(1)
})
