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
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/80 overflow-hidden">
      {header && (
        <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50 flex justify-between items-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {filename ?? language}
          </span>
          <CopyButton text={code} />
        </div>
      )}
      {!header && (
        <div className="absolute top-2 right-3">
          <CopyButton text={code} />
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}
