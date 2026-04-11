/**
 * Extracted payment signing logic — shared between TollClient and Toll Proxy.
 * Handles x402 payment creation and retry on Stellar.
 */

let cachedSigner: { signer: unknown; client: unknown; httpClient: unknown } | null = null

/** Create a reusable x402 payment signer from a Stellar secret key */
export async function createStellarPaymentSigner(secretKey: string, network?: string) {
  if (cachedSigner) return cachedSigner

  const { createEd25519Signer } = await import("@x402/stellar")
  const { x402Client, x402HTTPClient } = await import("@x402/core/client")
  const { ExactStellarScheme } = await import("@x402/stellar")

  const signer = createEd25519Signer(secretKey)
  const stellarScheme = new ExactStellarScheme(signer)
  const client = x402Client.fromConfig({
    schemes: [{
      network: (network ?? "stellar:pubnet") as `${string}:${string}`,
      client: stellarScheme,
    }],
  })
  const httpClient = new x402HTTPClient(client)

  cachedSigner = { signer, client, httpClient }
  return cachedSigner
}

/** Sign a payment and retry the request */
export async function signAndPay(
  secretKey: string,
  targetUrl: string,
  body: string,
  paymentRequired: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<{ success: boolean; response?: Response; status?: number; data?: unknown; error?: string }> {
  // Detect network from 402 response
  const network = (paymentRequired as { accepts?: Array<{ network?: string }> })
    ?.accepts?.[0]?.network ?? "stellar:pubnet"

  const { httpClient } = await createStellarPaymentSigner(secretKey, network)
  const client = httpClient as {
    createPaymentPayload: (pr: unknown) => Promise<unknown>
    encodePaymentSignatureHeader: (pp: unknown) => Record<string, string>
  }

  const paymentPayload = await client.createPaymentPayload(paymentRequired)
  const sigHeaders = client.encodePaymentSignatureHeader(paymentPayload)

  const resp = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json, text/event-stream",
      ...headers,
      ...sigHeaders,
    },
    body,
  })

  if (resp.status === 200) {
    return { success: true, response: resp, status: 200 }
  }

  return {
    success: false,
    status: resp.status,
    error: `Payment retry failed (${resp.status})`,
  }
}

/** Extract price from a 402 payment-required response */
export function extractPrice(paymentRequired: Record<string, unknown>): number {
  // x402 format
  const accepts = paymentRequired.accepts as Array<{ amount?: string }> | undefined
  if (accepts?.[0]?.amount) {
    return parseInt(accepts[0].amount, 10) / 1e7 // base units to USDC
  }
  // MPP / simple format
  if (paymentRequired.price) return parseFloat(paymentRequired.price as string)
  return 0
}

/** Reset the cached signer (useful for testing) */
export function resetSignerCache(): void {
  cachedSigner = null
}
