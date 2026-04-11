import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const category = searchParams.get("category")
  const protocol = searchParams.get("protocol")
  const maxPrice = searchParams.get("maxPrice")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

  try {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from("tools")
      .select(`
        id, name, description, price, currency, protocol, category,
        quality_score, latency_p50_ms, success_rate, total_calls,
        servers!inner (id, name, url, network, is_active, public_key)
      `)
      .eq("servers.is_active", true)
      .order("quality_score", { ascending: false })
      .limit(limit)

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }
    if (category) {
      query = query.eq("category", category)
    }
    if (protocol) {
      query = query.eq("protocol", protocol)
    }
    if (maxPrice) {
      // Filter tools where price <= maxPrice (cast to numeric comparison)
      query = query.lte("price", maxPrice)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Query failed", detail: error.message }, { status: 500 })
    }

    const tools = (data ?? []).map((t) => {
      const server = t.servers as unknown as { id: string; name: string; url: string; network: string; is_active: boolean }
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        currency: t.currency,
        protocol: t.protocol,
        category: t.category,
        qualityScore: t.quality_score,
        latencyMs: t.latency_p50_ms,
        successRate: t.success_rate,
        totalCalls: t.total_calls,
        server: {
          name: server.name,
          url: server.url,
          network: server.network,
        },
      }
    })

    return NextResponse.json({ tools, total: tools.length })
  } catch (err) {
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 })
  }
}
