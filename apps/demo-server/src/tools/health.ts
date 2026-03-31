import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function healthTool(server: McpServer): void {
  server.tool(
    "health_check",
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "ok",
                server: "Watchdog Lite",
                version: "0.1.0",
                powered_by: "Toll — MCP Monetization Gateway on Stellar",
                network: "Stellar Testnet",
                timestamp: new Date().toISOString(),
                tools: {
                  health_check: "FREE",
                  search_competitors: "0.01 USDC (x402)",
                  analyze_sentiment: "0.02 USDC (x402 + Claude AI)",
                  compare_products: "0.05 USDC (MPP)",
                },
              },
              null,
              2
            ),
          },
        ],
      }
    }
  )
}
