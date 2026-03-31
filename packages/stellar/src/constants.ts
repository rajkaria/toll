// Stellar testnet USDC Soroban Asset Contract address
export const USDC_SAC_TESTNET =
  "CBIELTK6YBZJU5UP2WWQEQPMBLOP6DE2MDGJYXU5WZXMGN5NQSRPDNX"

// Stellar mainnet USDC SAC
export const USDC_SAC_MAINNET =
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7EJJUD"

// USDC has 7 decimal places on Stellar
export const USDC_DECIMALS = 7

// Convert human-readable USDC to base units (stroops)
// "0.01" USDC → 100000
export function toUsdcBaseUnits(amount: string): string {
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed < 0) throw new Error(`Invalid USDC amount: ${amount}`)
  return Math.round(parsed * Math.pow(10, USDC_DECIMALS)).toString()
}

// Convert base units back to human-readable
export function fromUsdcBaseUnits(baseUnits: string): number {
  return parseInt(baseUnits, 10) / Math.pow(10, USDC_DECIMALS)
}

export const STELLAR_TESTNET_RPC = "https://soroban-testnet.stellar.org"

export const X402_HEADER_PAYMENT_REQUIRED = "payment-required"
export const X402_HEADER_PAYMENT_SIGNATURE = "payment-signature"
export const X402_HEADER_PAYMENT_RESPONSE = "payment-response"
