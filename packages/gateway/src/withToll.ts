import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { TollConfig } from "@toll/stellar"
import { isFree } from "./config.js"

interface RegisteredTool {
  handler: (...args: unknown[]) => unknown
  update: (config: { handler: (...args: unknown[]) => unknown }) => void
}

// withToll wraps an McpServer's registered tool handlers for stdio transport.
// Since MCP stdio cannot return HTTP 402, paid tools return a JSON-RPC error
// result with payment instructions when called without prior payment.
//
// NOTE: For HTTP transport, use tollMiddleware() instead — it returns real HTTP 402.
export function withToll(server: McpServer, config: TollConfig): McpServer {
  const registeredTools = (
    server as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools

  if (!registeredTools) {
    console.warn(
      "[Toll] Could not access _registeredTools on McpServer. Skipping stdio wrapping."
    )
    return server
  }

  for (const [toolName, tool] of Object.entries(registeredTools)) {
    const toolConfig = config.tools[toolName]
    if (!toolConfig || isFree(toolConfig)) continue

    tool.update({
      handler: async () => {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "PAYMENT_REQUIRED",
                tool: toolName,
                price: toolConfig.price,
                currency: toolConfig.currency,
                payTo: config.payTo,
                network: config.network,
                protocol: toolConfig.paymentMode ?? config.defaultPaymentMode,
                message: `This tool requires ${toolConfig.price} USDC. Use HTTP transport with Toll for automatic x402/MPP payment handling.`,
              }),
            },
          ],
        }
      },
    })
  }

  return server
}
