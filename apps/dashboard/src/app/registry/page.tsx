"use client"

import { useState, useEffect, useCallback } from "react"
import { ToolSearchCard } from "@/components/registry/ToolSearchCard"
import { ConnectModal } from "@/components/registry/ConnectModal"

interface RegistryTool {
  id: string
  name: string
  description: string | null
  price: string
  currency: string
  protocol: string
  category: string
  qualityScore: number
  totalCalls: number
  server: { name: string; url: string; network: string }
}

const PROTOCOLS = ["all", "x402", "mpp", "free"] as const

export default function RegistryPage() {
  const [tools, setTools] = useState<RegistryTool[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [protocol, setProtocol] = useState<string>("all")
  const [connectTool, setConnectTool] = useState<RegistryTool | null>(null)

  const fetchTools = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (protocol !== "all") params.set("protocol", protocol)
    try {
      const resp = await fetch(`/api/registry/discover?${params}`)
      if (resp.ok) {
        const data = (await resp.json()) as { tools: RegistryTool[] }
        setTools(data.tools)
      }
    } catch { /* empty */ }
    setLoading(false)
  }, [query, protocol])

  useEffect(() => {
    const timer = setTimeout(fetchTools, 300)
    return () => clearTimeout(timer)
  }, [fetchTools])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Tool Registry
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Discover paid MCP tools powered by Toll. Connect with one click and start using AI tools that earn their developers USDC on Stellar.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools by name or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700/50 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex gap-1.5">
            {PROTOCOLS.map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                  protocol === p
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-900 text-gray-400 border border-gray-700/50 hover:text-white"
                }`}
              >
                {p === "all" ? "All" : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-1/3 mb-4" />
                <div className="h-8 bg-gray-800 rounded mb-4" />
                <div className="h-8 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-white font-semibold text-lg mb-2">No tools found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {query ? `No tools match "${query}". Try a different search.` : "No tools registered yet. Be the first — run `toll register` to list your MCP server."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{tools.length} tool{tools.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <ToolSearchCard
                  key={tool.id}
                  {...tool}
                  onConnect={() => setConnectTool(tool)}
                />
              ))}
            </div>
          </>
        )}

        {/* Register CTA */}
        <div className="mt-16 text-center border-t border-gray-800 pt-12">
          <h3 className="text-white font-semibold text-lg mb-2">List your MCP server</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
            Register your Toll-powered server and let agents discover your tools.
          </p>
          <code className="inline-block bg-gray-900 border border-gray-700/50 rounded-lg px-4 py-2 text-emerald-400 text-sm font-mono">
            npx @rajkaria123/toll-cli register --url https://your-server.com/mcp
          </code>
        </div>
      </div>

      {/* Connect Modal */}
      {connectTool && (
        <ConnectModal
          serverName={connectTool.server.name}
          serverUrl={connectTool.server.url}
          onClose={() => setConnectTool(null)}
        />
      )}
    </main>
  )
}
