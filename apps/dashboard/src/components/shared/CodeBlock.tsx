"use client"

import { CopyButton } from "./CopyButton"

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const header = filename || language

  return (
    <div className="rounded-xl border border-white/5 bg-[#0d1117] overflow-hidden group">
      {header && (
        <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex justify-between items-center">
          <span className="text-[11px] text-gray-500 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {filename ?? language}
          </span>
          <CopyButton text={code} />
        </div>
      )}
      {!header && (
        <div className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} />
        </div>
      )}
      <pre className="p-4 overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <code className="text-[13px] text-gray-300 leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}
