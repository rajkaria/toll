import type { Metadata } from "next"
import { SiteNav } from "@/components/shared/SiteNav"
import { SiteFooter } from "@/components/shared/SiteFooter"
import "./globals.css"

export const metadata: Metadata = {
  title: "Toll — MCP Monetization Gateway for Stellar",
  description: "Charge AI agents for MCP tool usage with x402 and MPP micropayments on Stellar",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-gray-950 text-gray-100">
      <body className="min-h-screen font-mono">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
