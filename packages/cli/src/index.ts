import { Command } from "commander"
import { initCommand } from "./commands/init.js"

const program = new Command()

program
  .name("toll")
  .description("Toll — MCP Monetization Gateway CLI")
  .version("0.1.0")

program
  .command("init")
  .description("Initialize a new Toll configuration in the current directory")
  .option("-y, --yes", "Accept defaults without prompting")
  .action(initCommand)

program
  .command("status")
  .description("Show Toll configuration and tool pricing")
  .action(async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")
    const configPath = path.resolve("toll.config.json")

    if (!fs.existsSync(configPath)) {
      console.error("No toll.config.json found. Run 'toll init' first.")
      process.exit(1)
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
    console.log("\n  Toll Configuration")
    console.log(`  Network:  ${config.network}`)
    console.log(`  Pay to:   ${config.payTo}`)
    console.log(`  Protocol: ${config.defaultPaymentMode}`)
    console.log(`\n  Tools:`)
    for (const [name, cfg] of Object.entries(config.tools)) {
      const c = cfg as Record<string, unknown>
      const price = parseFloat(c.price as string) === 0 ? "FREE" : `$${c.price} USDC`
      console.log(`    ${name}: ${price}`)
    }
    console.log()
  })

program.parse()
