export interface ToolListing {
  name: string
  description: string
  price: string
  currency: string
  protocol: "x402" | "mpp" | "free"
  category: string
  server: string
}

export const TOOL_LISTINGS: ToolListing[] = [
  {
    name: "health_check",
    description: "Server status, version, and available tools. Use to verify the MCP server is running and discover its capabilities.",
    price: "0",
    currency: "USDC",
    protocol: "free",
    category: "Utility",
    server: "Watchdog Lite",
  },
  {
    name: "search_competitors",
    description: "Search a competitive intelligence database. Returns company profiles with strengths, pricing, market position, and recent updates.",
    price: "0.01",
    currency: "USDC",
    protocol: "x402",
    category: "Intelligence",
    server: "Watchdog Lite",
  },
  {
    name: "analyze_sentiment",
    description: "AI-powered sentiment analysis of any URL. Uses Claude to extract tone, confidence, themes, and a one-sentence summary.",
    price: "0.02",
    currency: "USDC",
    protocol: "x402",
    category: "AI Analysis",
    server: "Watchdog Lite",
  },
  {
    name: "compare_products",
    description: "Side-by-side product comparison with pricing, strengths, weaknesses, integrations, and a recommendation.",
    price: "0.05",
    currency: "USDC",
    protocol: "mpp",
    category: "Intelligence",
    server: "Watchdog Lite",
  },
]
