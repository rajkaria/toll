import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

const REGISTRY_URL = "https://tollpay.xyz"

export async function registerCommand(options: { url?: string }) {
  // Load toll.config.json
  const configPath = path.resolve("toll.config.json")
  if (!fs.existsSync(configPath)) {
    console.error("No toll.config.json found. Run 'toll init' first.")
    process.exit(1)
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
  const serverUrl = options.url ?? `http://localhost:${process.env.PORT ?? "3002"}`

  console.log(`\n  Registering server: ${serverUrl}`)
  console.log(`  Network: ${config.network}`)

  // Load or create wallet
  const walletPath = path.join(os.homedir(), ".toll", "wallet.json")
  let secretKey: string
  let publicKey: string

  if (fs.existsSync(walletPath)) {
    const wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"))
    secretKey = wallet.secretKey
    publicKey = wallet.publicKey
    console.log(`  Wallet: ${publicKey}`)
  } else {
    // Auto-create wallet
    const { Keypair } = await import("@stellar/stellar-sdk")
    const kp = Keypair.random()
    secretKey = kp.secret()
    publicKey = kp.publicKey()
    const tollDir = path.join(os.homedir(), ".toll")
    if (!fs.existsSync(tollDir)) fs.mkdirSync(tollDir, { recursive: true, mode: 0o700 })
    fs.writeFileSync(walletPath, JSON.stringify({
      publicKey, secretKey, createdAt: new Date().toISOString(), network: config.network,
    }, null, 2), { mode: 0o600 })
    console.log(`  Created wallet: ${publicKey}`)
  }

  // Step 1: Get challenge
  console.log(`  Requesting challenge...`)
  const challengeResp = await fetch(`${REGISTRY_URL}/api/registry/challenge?publicKey=${publicKey}`)
  if (!challengeResp.ok) {
    console.error(`  Failed to get challenge: ${challengeResp.status}`)
    process.exit(1)
  }
  const { challenge } = (await challengeResp.json()) as { challenge: string }

  // Step 2: Sign challenge
  const { Keypair } = await import("@stellar/stellar-sdk")
  const keypair = Keypair.fromSecret(secretKey)
  const signature = keypair.sign(Buffer.from(challenge, "utf-8")).toString("base64")

  // Step 3: Fetch tools from server
  let tools: Array<{ name: string; price: string; currency: string; protocol: string; description?: string }> = []
  try {
    const healthResp = await fetch(`${serverUrl}/health/tools`)
    if (healthResp.ok) {
      const manifest = (await healthResp.json()) as { tools: Array<{ name: string; price: string; currency: string; paymentMode: string; description?: string; free: boolean }> }
      tools = manifest.tools.map((t) => ({
        name: t.name,
        price: t.price,
        currency: t.currency ?? "USDC",
        protocol: t.free ? "free" : (t.paymentMode ?? "x402"),
        description: t.description ?? undefined,
      }))
    }
  } catch {
    // Fall back to config tools
    tools = Object.entries(config.tools).map(([name, cfg]) => {
      const c = cfg as Record<string, unknown>
      return {
        name,
        price: String(c.price ?? "0"),
        currency: String(c.currency ?? "USDC"),
        protocol: parseFloat(String(c.price ?? "0")) === 0 ? "free" : String(c.paymentMode ?? config.defaultPaymentMode ?? "x402"),
      }
    })
  }

  console.log(`  Found ${tools.length} tools`)

  // Step 4: Register
  const registerResp = await fetch(`${REGISTRY_URL}/api/registry/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: serverUrl,
      name: config.name ?? path.basename(process.cwd()),
      publicKey,
      network: config.network ?? "mainnet",
      challenge,
      signature,
      tools,
    }),
  })

  if (!registerResp.ok) {
    const err = await registerResp.json()
    console.error(`  Registration failed: ${JSON.stringify(err)}`)
    process.exit(1)
  }

  const result = (await registerResp.json()) as { serverId: string; toolCount: number }
  console.log(`\n  Registered successfully!`)
  console.log(`  Server ID: ${result.serverId}`)
  console.log(`  Tools: ${result.toolCount}`)
  console.log(`  View at: ${REGISTRY_URL}/registry\n`)
}
