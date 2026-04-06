export interface ValidationConfig {
  maxPriceSlippage?: string // default "0.001"
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validatePaymentAmount(
  paidAmountRaw: string | undefined,
  expectedPrice: string,
  config?: ValidationConfig
): ValidationResult {
  if (!paidAmountRaw) {
    // No amount info from facilitator — trust settlement
    return { valid: true }
  }

  const paid = parseFloat(paidAmountRaw)
  const expected = parseFloat(expectedPrice)
  const slippage = parseFloat(config?.maxPriceSlippage ?? "0.001")

  if (isNaN(paid) || isNaN(expected)) {
    return { valid: false, error: "Invalid payment amount format" }
  }

  if (paid < expected - slippage) {
    return {
      valid: false,
      error: `Underpayment: paid $${paid.toFixed(4)} but $${expected.toFixed(4)} required`,
    }
  }

  return { valid: true }
}
