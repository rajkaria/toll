import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

function ask(rl: readline.Interface, question: string, defaultVal?: string): Promise<string> {
  const suffix = defaultVal ? ` [${defaultVal}]` : ""
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || "")
    })
  })
}

export async function initCommand(opts: { yes?: boolean }) {
  const configPath = path.resolve("toll.config.json")
  const envPath = path.resolve(".env.example")

  if (fs.existsSync(configPath) && !opts.yes) {
    console.error("  toll.config.json already exists. Delete it first or use --yes to overwrite.")
    process.exit(1)
  }

  console.log("\n  Toll Init — Configure your MCP monetization gateway\n")

  let network = "testnet"
  let payTo = ""
  let mode = "x402"
  const tools: Record<string, { price: string; currency: string; paymentMode?: string }> = {}

  if (opts.yes) {
    payTo = "G_YOUR_STELLAR_ADDRESS_HERE"
    tools["my_tool"] = { price: "0.01", currency: "USDC" }
    tools["my_free_tool"] = { price: "0", currency: "USDC" }
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    network = await ask(rl, "Network (testnet/mainnet)", "testnet")
    payTo = await ask(rl, "Stellar address to receive payments (G...)")
    mode = await ask(rl, "Default payment mode (x402/mpp)", "x402")

    console.log("\n  Add tools (enter empty name to finish):\n")
    while (true) {
      const name = await ask(rl, "Tool name")
      if (!name) break
      const price = await ask(rl, `Price for ${name} in USDC (0 = free)`, "0.01")
      const toolMode = await ask(rl, `Payment mode for ${name}`, mode)
      tools[name] = { price, currency: "USDC", ...(toolMode !== mode && { paymentMode: toolMode }) }
    }

    if (Object.keys(tools).length === 0) {
      tools["my_tool"] = { price: "0.01", currency: "USDC" }
    }

    rl.close()
  }

  const config = {
    network,
    payTo: payTo || "G_YOUR_STELLAR_ADDRESS_HERE",
    facilitatorUrl: "https://x402.org/facilitator",
    defaultPaymentMode: mode,
    tools,
    spendingPolicy: {
      maxPerCall: "1.00",
      maxDailyPerCaller: "10.00",
      maxDailyGlobal: "100.00",
    },
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
  console.log(`\n  Created ${configPath}`)

  const envContent = `PORT=3002
TOLL_SERVER_SECRET=S_YOUR_SECRET_KEY
TOLL_SERVER_ADDRESS=${config.payTo}
TOLL_DATA_DIR=~/.toll
X402_FACILITATOR_URL=https://x402.org/facilitator
`
  fs.writeFileSync(envPath, envContent)
  console.log(`  Created ${envPath}`)

  console.log(`
  Next steps:
    1. Update payTo in toll.config.json with your Stellar address
    2. Set TOLL_SERVER_SECRET in .env
    3. Add tollMiddleware(config) to your Express server
    4. Run your server: pnpm dev
`)
}
