"use client"

import { useState } from "react"
import { ProtocolBadge } from "@/components/shared/ProtocolBadge"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { TOOL_LISTINGS, type ToolListing } from "@/lib/tools-registry"
import { QUICK_START_SNIPPET } from "@/lib/snippets"

type Filter = "all" | "free" | "paid" | "x402" | "mpp"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
  { key: "x402", label: "x402" },
  { key: "mpp", label: "MPP" },
]

function filterTools(tools: ToolListing[], filter: Filter): ToolListing[] {
  if (filter === "all") return tools
  if (filter === "free") return tools.filter((t) => parseFloat(t.price) === 0)
  if (filter === "paid") return tools.filter((t) => parseFloat(t.price) > 0)
  return tools.filter((t) => t.protocol === filter)
}

function ToolCard({ tool }: { tool: ToolListing }) {
  const [expanded, setExpanded] = useState(false)
  const isFree = parseFloat(tool.price) === 0

  const connectSnippet = `// MCP client config for ${tool.name}
{
  "mcpServers": {
    "${tool.server.toLowerCase().replace(/\\s+/g, "-")}": {
      "url": "http://localhost:3002/mcp",
      "transport": "streamable-http"
    }
  }
}

// Tool: ${tool.name}
// Price: ${isFree ? "FREE" : `$${tool.price} ${tool.currency}`}
// Protocol: ${tool.protocol === "free" ? "None" : tool.protocol}`

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white">{tool.name}</h3>
          <span className="text-xs text-gray-600">{tool.category}</span>
        </div>
        <ProtocolBadge protocol={tool.protocol} />
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-1">{tool.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold tabular-nums text-emerald-400">
          {isFree ? "FREE" : `$${tool.price}`}
          {!isFree && <span className="text-xs text-gray-500 font-normal ml-1">{tool.currency}</span>}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? "Hide" : "Connect"}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 border-t border-gray-800 pt-4">
          <CodeBlock code={connectSnippet} language="json" />
        </div>
      )}
    </div>
  )
}

export default function ToolsPage() {
  const [filter, setFilter] = useState<Filter>("all")
  const filtered = filterTools(TOOL_LISTINGS, filter)

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Available Tools</h1>
        <p className="text-sm text-gray-500 mt-2">
          Monetized MCP tools on the Watchdog Lite demo server
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.key
                ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                : "border-gray-700 text-gray-500 hover:text-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {filtered.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>

      {/* Integration */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-white tracking-tight text-center mb-2">
          Add Your Own Tools
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          Wrap any MCP server with Toll to start charging for tool calls
        </p>
        <CodeBlock code={QUICK_START_SNIPPET} language="typescript" filename="server.ts" />
      </div>
    </main>
  )
}
