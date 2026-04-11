"use client"

import { useState } from "react"

interface ConnectModalProps {
  serverName: string
  serverUrl: string
  onClose: () => void
}

export function ConnectModal({ serverName, serverUrl, onClose }: ConnectModalProps) {
  const [copied, setCopied] = useState(false)

  const config = JSON.stringify({
    mcpServers: {
      [serverName.toLowerCase().replace(/\s+/g, "-")]: {
        url: `http://localhost:3010/mcp?target=${serverUrl}`,
        transport: "streamable-http",
      },
    },
  }, null, 2)

  const proxyCmd = `npx @rajkaria123/toll-proxy --target ${serverUrl}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Connect to {serverName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">1. Start the Toll Proxy:</p>
            <div className="bg-gray-950 rounded-lg p-3 font-mono text-sm text-emerald-400 relative">
              <code>{proxyCmd}</code>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-2">2. Add to your MCP client config:</p>
            <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs text-gray-300 relative overflow-x-auto">
              <pre>{config}</pre>
              <button
                onClick={() => { navigator.clipboard.writeText(config); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-gray-500 text-xs">
            The proxy auto-creates a Stellar wallet and handles payments for you.
            Fund it with USDC to start using paid tools.
          </p>
        </div>
      </div>
    </div>
  )
}
