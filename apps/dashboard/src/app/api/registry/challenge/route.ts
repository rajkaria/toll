import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const publicKey = searchParams.get("publicKey")

  if (!publicKey || !publicKey.startsWith("G") || publicKey.length !== 56) {
    return NextResponse.json({ error: "Invalid Stellar public key" }, { status: 400 })
  }

  const challenge = randomBytes(32).toString("hex")
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

  return NextResponse.json({ challenge, expiresAt })
}
