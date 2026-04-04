import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #030712 0%, #0a1628 50%, #030712 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 400,
            height: 200,
            borderRadius: "50%",
            background: "rgba(52, 211, 153, 0.12)",
            filter: "blur(60px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #34d399, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#030712",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", color: "white", fontSize: 40, fontWeight: 700 }}>
            Toll<span style={{ color: "#34d399" }}>pay</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 800,
            marginBottom: 16,
          }}
        >
          MCP Monetization Gateway
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: 600,
            marginBottom: 32,
          }}
        >
          Charge AI agents for tool calls with x402 + MPP on Stellar
        </div>

        {/* Protocol badges */}
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#93c5fd",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            x402
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#c4b5fd",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            MPP
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              background: "rgba(52, 211, 153, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "#6ee7b7",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            USDC on Stellar
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
