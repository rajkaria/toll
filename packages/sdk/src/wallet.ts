import { Keypair } from "@stellar/stellar-sdk"
import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

export interface TollWallet {
  publicKey: string
  secretKey: string
  createdAt: string
  network: "mainnet" | "testnet"
}

export class WalletManager {
  private configDir: string

  constructor(configDir?: string) {
    this.configDir = configDir ?? path.join(os.homedir(), ".toll")
  }

  /** Get existing wallet or create a new one */
  getOrCreate(network: "mainnet" | "testnet" = "mainnet"): TollWallet {
    const existing = this.getWallet()
    if (existing) return existing
    return this.createWallet(network)
  }

  /** Load existing wallet from disk */
  getWallet(): TollWallet | null {
    const walletPath = this.walletPath()
    if (!fs.existsSync(walletPath)) return null
    try {
      const data = JSON.parse(fs.readFileSync(walletPath, "utf-8"))
      if (data.publicKey && data.secretKey) return data as TollWallet
      return null
    } catch {
      return null
    }
  }

  /** Generate a new Stellar Ed25519 keypair and persist to disk */
  createWallet(network: "mainnet" | "testnet" = "mainnet"): TollWallet {
    const keypair = Keypair.random()
    const wallet: TollWallet = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      createdAt: new Date().toISOString(),
      network,
    }

    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 })
    }

    const walletPath = this.walletPath()
    fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2), { mode: 0o600 })

    return wallet
  }

  /** Get instructions for funding the wallet with USDC */
  fundingInstructions(publicKey: string): string {
    return [
      `\nFund your Toll wallet with USDC on Stellar:`,
      `  Address: ${publicKey}`,
      ``,
      `  Option 1: LOBSTR wallet (lobstr.co)`,
      `    - Buy USDC with credit card, send to the address above`,
      ``,
      `  Option 2: Exchange route`,
      `    - Buy XLM on Coinbase/Binance, send to a Stellar wallet`,
      `    - Swap XLM → USDC on StellarX (stellarx.com)`,
      `    - Send USDC to the address above`,
      ``,
      `  Option 3: MoneyGram Access`,
      `    - Cash to USDC via Stellar (available in 180+ countries)`,
      ``,
      `  Check balance: https://stellar.expert/explorer/public/account/${publicKey}`,
    ].join("\n")
  }

  private walletPath(): string {
    return path.join(this.configDir, "wallet.json")
  }
}
