import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { Keypair } from "@stellar/stellar-sdk"

interface RegisterBody {
  url: string
  name: string
  publicKey: string
  network: "mainnet" | "testnet"
  challenge: string
  signature: string
  tools: Array<{
    name: string
    description?: string
    price: string
    currency?: string
    protocol?: "x402" | "mpp" | "free"
    category?: string
  }>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody

    if (!body.url || !body.name || !body.publicKey || !body.challenge || !body.signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify Stellar signature
    try {
      const keypair = Keypair.fromPublicKey(body.publicKey)
      const valid = keypair.verify(
        Buffer.from(body.challenge, "utf-8"),
        Buffer.from(body.signature, "base64"),
      )
      if (!valid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid public key or signature" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Upsert server
    const { data: server, error: serverErr } = await supabase
      .from("servers")
      .upsert(
        {
          url: body.url,
          name: body.name,
          public_key: body.publicKey,
          network: body.network ?? "mainnet",
          last_heartbeat: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "url" },
      )
      .select("id")
      .single()

    if (serverErr || !server) {
      return NextResponse.json({ error: "Failed to register server", detail: serverErr?.message }, { status: 500 })
    }

    // Delete existing tools and re-insert
    await supabase.from("tools").delete().eq("server_id", server.id)

    if (body.tools?.length) {
      const toolRows = body.tools.map((t) => ({
        server_id: server.id,
        name: t.name,
        description: t.description ?? null,
        price: t.price ?? "0",
        currency: t.currency ?? "USDC",
        protocol: parseFloat(t.price ?? "0") === 0 ? "free" : (t.protocol ?? "x402"),
        category: t.category ?? "general",
      }))

      const { error: toolErr } = await supabase.from("tools").insert(toolRows)
      if (toolErr) {
        return NextResponse.json({ error: "Failed to register tools", detail: toolErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      serverId: server.id,
      url: body.url,
      toolCount: body.tools?.length ?? 0,
      message: "Server registered successfully",
    })
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body", detail: String(err) }, { status: 400 })
  }
}
