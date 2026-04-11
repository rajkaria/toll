import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { Keypair } from "@stellar/stellar-sdk"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url: string; publicKey: string; signature: string; timestamp: string }

    if (!body.url || !body.publicKey || !body.signature || !body.timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify timestamp is within 5 minutes
    const ts = new Date(body.timestamp).getTime()
    if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Timestamp too old" }, { status: 400 })
    }

    // Verify signature
    try {
      const keypair = Keypair.fromPublicKey(body.publicKey)
      const valid = keypair.verify(
        Buffer.from(body.timestamp, "utf-8"),
        Buffer.from(body.signature, "base64"),
      )
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid public key or signature" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from("servers")
      .update({ last_heartbeat: new Date().toISOString(), is_active: true })
      .eq("url", body.url)
      .eq("public_key", body.publicKey)

    if (error) {
      return NextResponse.json({ error: "Update failed", detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: "ok", heartbeat: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", detail: String(err) }, { status: 400 })
  }
}
