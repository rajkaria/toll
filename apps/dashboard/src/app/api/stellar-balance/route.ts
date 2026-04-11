import { NextResponse } from "next/server"

const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address || !address.startsWith("G") || address.length !== 56) {
    return NextResponse.json({ error: "Invalid Stellar address" }, { status: 400 })
  }

  try {
    const resp = await fetch(`https://horizon.stellar.org/accounts/${address}`, {
      next: { revalidate: 30 },
    })

    if (!resp.ok) {
      if (resp.status === 404) {
        return NextResponse.json({
          address,
          xlm: "0",
          usdc: "0",
          funded: false,
          message: "Account not found on Stellar mainnet. Send at least 1 XLM to activate it.",
        })
      }
      return NextResponse.json({ error: "Horizon API error" }, { status: 502 })
    }

    const data = (await resp.json()) as {
      balances: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }>
    }

    const xlm = data.balances.find((b) => b.asset_type === "native")?.balance ?? "0"
    const usdc = data.balances.find(
      (b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER,
    )?.balance ?? "0"

    return NextResponse.json({
      address,
      xlm,
      usdc,
      funded: true,
      hasTrustline: parseFloat(usdc) > 0 || data.balances.some(
        (b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER,
      ),
    })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch balance", detail: String(err) }, { status: 500 })
  }
}
