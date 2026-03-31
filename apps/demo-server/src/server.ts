import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { healthTool } from "./tools/health.js"
import { searchTool } from "./tools/search.js"
import { sentimentTool } from "./tools/sentiment.js"
import { compareTool } from "./tools/compare.js"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "Watchdog Lite",
    version: "0.1.0",
  })

  healthTool(server)
  searchTool(server)
  sentimentTool(server)
  compareTool(server)

  return server
}
