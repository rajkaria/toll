import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const COMPETITOR_DATA = [
  {
    name: "CompetitorAlpha",
    website: "https://competitor-alpha.example.com",
    founded: 2019,
    employees: "50-200",
    funding: "$12M Series A",
    strengths: ["Fast deployment", "Good documentation", "Active community"],
    weaknesses: ["Limited enterprise features", "No SLA"],
    pricing: "Freemium, $49/mo Pro",
  },
  {
    name: "BetaCorp Solutions",
    website: "https://betacorp.example.com",
    founded: 2017,
    employees: "200-500",
    funding: "$45M Series B",
    strengths: ["Enterprise focus", "24/7 support", "SOC2 compliant"],
    weaknesses: ["Expensive", "Complex onboarding", "Slow iteration"],
    pricing: "$299/mo, custom enterprise",
  },
  {
    name: "GammaTools",
    website: "https://gammatools.example.com",
    founded: 2021,
    employees: "10-50",
    funding: "Bootstrapped",
    strengths: ["Innovative features", "Low cost", "Developer-friendly"],
    weaknesses: ["Small team", "Limited integrations", "No mobile app"],
    pricing: "$19/mo flat",
  },
]

export function searchTool(server: McpServer): void {
  server.tool(
    "search_competitors",
    { query: z.string().describe("Search query, e.g. 'project management tools'") },
    async ({ query }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                query,
                results: COMPETITOR_DATA,
                count: COMPETITOR_DATA.length,
                source: "Watchdog Lite — Paid via x402 on Stellar Mainnet",
                timestamp: new Date().toISOString(),
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
