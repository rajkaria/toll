/**
 * AssetRegistry — resolves currency codes to Stellar SAC addresses.
 * Built-in: USDC, XLM. Custom assets via config.
 */

import { USDC_SAC_TESTNET, USDC_SAC_MAINNET, USDC_DECIMALS } from "../constants.js"

export interface AssetInfo {
  code: string
  address: string
  decimals: number
  native: boolean
}

const XLM_SAC_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
const XLM_SAC_MAINNET = "CAS3J7GYLGVE45MR3HPSFG352DAANEV5GGMFTO3IZIE4JMCDALQO57Y"

const BUILT_IN: Record<string, Record<string, AssetInfo>> = {
  testnet: {
    USDC: { code: "USDC", address: USDC_SAC_TESTNET, decimals: USDC_DECIMALS, native: false },
    XLM: { code: "XLM", address: XLM_SAC_TESTNET, decimals: 7, native: true },
  },
  mainnet: {
    USDC: { code: "USDC", address: USDC_SAC_MAINNET, decimals: USDC_DECIMALS, native: false },
    XLM: { code: "XLM", address: XLM_SAC_MAINNET, decimals: 7, native: true },
  },
}

export class AssetRegistry {
  private assets: Record<string, AssetInfo>

  constructor(
    network: "testnet" | "mainnet",
    custom?: Record<string, { testnet: string; mainnet: string; decimals?: number }>
  ) {
    this.assets = { ...BUILT_IN[network] }

    if (custom) {
      for (const [code, addrs] of Object.entries(custom)) {
        this.assets[code] = {
          code,
          address: network === "testnet" ? addrs.testnet : addrs.mainnet,
          decimals: addrs.decimals ?? 7,
          native: false,
        }
      }
    }
  }

  /** Resolve a currency code to its SAC address and decimals */
  resolve(currency: string): AssetInfo | null {
    return this.assets[currency] ?? null
  }

  /** List all registered assets */
  list(): AssetInfo[] {
    return Object.values(this.assets)
  }

  /** Check if an asset is registered */
  has(currency: string): boolean {
    return currency in this.assets
  }
}
