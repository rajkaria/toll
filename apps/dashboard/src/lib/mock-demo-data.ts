export interface DemoStep {
  id: string
  title: string
  description: string
  request: object
  response: object
  status: number
  isPayment?: boolean
  retryRequest?: object
  retryResponse?: object
  retryStatus?: number
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "free",
    title: "Free Tool Call",
    description: "Calling health_check — no payment needed",
    request: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "health_check",
        arguments: {},
      },
    },
    response: {
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ok",
              server: "Watchdog Lite",
              version: "0.1.0",
              powered_by: "Toll — The Stripe for MCP Servers",
              network: "Stellar Mainnet",
              tools: {
                health_check: "FREE",
                search_competitors: "0.01 USDC (x402)",
                analyze_sentiment: "0.02 USDC (x402)",
                compare_products: "0.05 USDC (MPP)",
              },
            }),
          },
        ],
      },
      jsonrpc: "2.0",
      id: 1,
    },
    status: 200,
  },
  {
    id: "paid",
    title: "Paid Tool Call (x402)",
    description: "Calling search_competitors — requires $0.01 USDC payment",
    isPayment: true,
    request: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "search_competitors",
        arguments: { query: "project management" },
      },
    },
    response: {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: "stellar:pubnet",
          asset: "CBIELTK6...SRPDN5",
          payTo: "GAYTNRAS...PH6N",
          amount: "100000",
          maxTimeoutSeconds: 300,
          description: "Payment for MCP tool: search_competitors (0.01 USDC)",
        },
      ],
      resource: { url: "http://localhost:3002/mcp" },
    },
    status: 402,
    retryRequest: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "search_competitors",
        arguments: { query: "project management" },
      },
      _headers: { "payment-signature": "eyJ0eXBlIjoic3RlbGxhci..." },
    },
    retryResponse: {
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query: "project management",
              results: [
                { name: "CompetitorAlpha", category: "Project Management", pricing: "$12/mo" },
                { name: "BetaCorp", category: "Collaboration", pricing: "$8/mo" },
              ],
              source: "Watchdog Lite — Paid via x402 on Stellar mainnet",
            }),
          },
        ],
      },
      jsonrpc: "2.0",
      id: 2,
    },
    retryStatus: 200,
  },
]
