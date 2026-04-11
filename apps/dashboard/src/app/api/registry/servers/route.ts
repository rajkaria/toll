import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: servers, error } = await supabase
      .from("servers")
      .select(`
        id, url, name, public_key, network, protocols,
        registered_at, last_heartbeat, is_active, version,
        tools (id, name, price, protocol)
      `)
      .eq("is_active", true)
      .order("last_heartbeat", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Query failed", detail: error.message }, { status: 500 })
    }

    const result = (servers ?? []).map((s) => ({
      id: s.id,
      url: s.url,
      name: s.name,
      network: s.network,
      registeredAt: s.registered_at,
      lastHeartbeat: s.last_heartbeat,
      toolCount: (s.tools as unknown[])?.length ?? 0,
      tools: s.tools,
    }))

    return NextResponse.json({ servers: result, total: result.length })
  } catch (err) {
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 })
  }
}
