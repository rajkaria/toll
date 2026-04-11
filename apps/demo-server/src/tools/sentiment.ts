import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

export function sentimentTool(server: McpServer): void {
  server.tool(
    "analyze_sentiment",
    {
      url: z.string().url().describe("URL of the webpage or article to analyze"),
    },
    async ({ url }) => {
      const client = new Anthropic()

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Analyze the sentiment and tone of the content at this URL: ${url}

Provide a JSON response with:
- overall_sentiment: "positive", "negative", or "neutral"
- confidence: 0.0 to 1.0
- tone: array of detected tones (e.g. ["professional", "optimistic"])
- summary: one-sentence summary of the content
- key_themes: array of main topics/themes

Respond ONLY with valid JSON, no markdown.`,
          },
        ],
      })

      const raw = message.content[0].type === "text" ? message.content[0].text : "{}"

      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = { raw_response: raw }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                url,
                analysis: parsed,
                model: "claude-haiku-4-5-20251001",
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
