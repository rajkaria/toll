import { NextResponse } from "next/server"

const FALLBACK_PRICE = 0.12
const CACHE_TTL_MS = 60_000

let cachedPrice: number | null = null
let cachedAt = 0

export async function GET() {
  const now = Date.now()

  if (cachedPrice !== null && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ xlmUsd: cachedPrice })
  }

  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    )
    if (resp.ok) {
      const data = (await resp.json()) as { stellar?: { usd?: number } }
      const price = data.stellar?.usd ?? FALLBACK_PRICE
      cachedPrice = price
      cachedAt = now
      return NextResponse.json({ xlmUsd: price })
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ xlmUsd: cachedPrice ?? FALLBACK_PRICE })
}
