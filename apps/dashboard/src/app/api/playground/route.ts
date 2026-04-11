import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.TOLL_API_URL || "https://api.tollpay.xyz"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${API_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify(body),
    })

    // Read the response - handle SSE by collecting the full body
    const contentType = res.headers.get("content-type") || ""
    let data: unknown

    if (contentType.includes("text/event-stream")) {
      // Parse SSE events to extract JSON-RPC response
      const text = await res.text()
      const lines = text.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            data = JSON.parse(line.slice(6))
          } catch {
            // skip non-JSON data lines
          }
        }
      }
      if (!data) data = { raw: text }
    } else {
      data = await res.json()
    }

    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to reach demo server" }, { status: 502 })
  }
}
