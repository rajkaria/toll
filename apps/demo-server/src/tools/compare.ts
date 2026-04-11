import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const PRODUCT_DB: Record<string, Record<string, unknown>> = {
  github: {
    name: "GitHub",
    category: "Code Hosting & Collaboration",
    pricing: "Free tier, $4/mo per user (Team), $21/mo per user (Enterprise)",
    strengths: ["Largest developer community", "GitHub Actions CI/CD", "Copilot AI integration", "Marketplace ecosystem"],
    weaknesses: ["Limited free private repos for orgs", "Complex permissions model"],
    integrations: ["Slack", "Jira", "VS Code", "Jenkins", "AWS"],
    languages: "All",
    founded: 2008,
  },
  gitlab: {
    name: "GitLab",
    category: "Code Hosting & Collaboration",
    pricing: "Free tier, $29/mo per user (Premium), $99/mo per user (Ultimate)",
    strengths: ["Built-in CI/CD", "Self-hosted option", "DevSecOps platform", "Open source"],
    weaknesses: ["Steeper learning curve", "Heavier resource usage"],
    integrations: ["Kubernetes", "Jira", "Slack", "Prometheus"],
    languages: "All",
    founded: 2011,
  },
  linear: {
    name: "Linear",
    category: "Project Management",
    pricing: "Free tier, $8/mo per user (Standard), $14/mo per user (Plus)",
    strengths: ["Fast UI", "Developer-first design", "GitHub sync", "Keyboard shortcuts"],
    weaknesses: ["Limited reporting", "No time tracking", "Smaller ecosystem"],
    integrations: ["GitHub", "GitLab", "Slack", "Figma"],
    languages: "N/A",
    founded: 2019,
  },
  jira: {
    name: "Jira",
    category: "Project Management",
    pricing: "Free (10 users), $8.15/mo per user (Standard), $16/mo per user (Premium)",
    strengths: ["Highly customizable", "Large plugin marketplace", "Enterprise features", "Advanced reporting"],
    weaknesses: ["Complex setup", "Slow UI", "Expensive at scale"],
    integrations: ["Confluence", "GitHub", "Slack", "Zendesk", "AWS"],
    languages: "N/A",
    founded: 2002,
  },
}

function findProduct(query: string): Record<string, unknown> | null {
  const q = query.toLowerCase()
  for (const [key, data] of Object.entries(PRODUCT_DB)) {
    if (q.includes(key) || (data.name as string).toLowerCase().includes(q)) {
      return data
    }
  }
  return null
}

export function compareTool(server: McpServer): void {
  server.tool(
    "compare_products",
    {
      product_a: z.string().describe("First product name (e.g. 'GitHub', 'Linear')"),
      product_b: z.string().describe("Second product name (e.g. 'GitLab', 'Jira')"),
    },
    async ({ product_a, product_b }) => {
      const a = findProduct(product_a)
      const b = findProduct(product_b)

      const result = {
        comparison: {
          product_a: a ?? {
            name: product_a,
            note: "Not in database — showing placeholder",
            category: "Unknown",
            pricing: "Check vendor website",
            strengths: [],
            weaknesses: [],
          },
          product_b: b ?? {
            name: product_b,
            note: "Not in database — showing placeholder",
            category: "Unknown",
            pricing: "Check vendor website",
            strengths: [],
            weaknesses: [],
          },
        },
        recommendation:
          a && b
            ? `Both ${(a.name as string)} and ${(b.name as string)} are strong options. Choose ${(a.name as string)} for ${(a.strengths as string[])[0]?.toLowerCase() ?? "its core features"}, or ${(b.name as string)} for ${(b.strengths as string[])[0]?.toLowerCase() ?? "its unique advantages"}.`
            : "Insufficient data for recommendation.",
        source: "Watchdog Lite — Paid via MPP on Stellar Mainnet",
        timestamp: new Date().toISOString(),
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    }
  )
}
