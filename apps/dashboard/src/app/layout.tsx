import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Toll — MCP Monetization Dashboard",
  description: "Real-time earnings from your monetized MCP server on Stellar",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-gray-950 text-gray-100">
      <body className="min-h-screen font-mono">{children}</body>
    </html>
  )
}
