import type { Metadata } from "next"
import { SiteNav } from "@/components/shared/SiteNav"
import { SiteFooter } from "@/components/shared/SiteFooter"
import "./globals.css"

export const metadata: Metadata = {
  title: "Toll — The Stripe for MCP Servers",
  description: "Three lines of code. Your MCP server has a paywall. USDC settles on Stellar.",
  openGraph: {
    title: "Toll — The Stripe for MCP Servers",
    description: "Three lines of code. Your MCP server has a paywall. USDC settles on Stellar.",
    siteName: "Tollpay",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Toll — The Stripe for MCP Servers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toll — The Stripe for MCP Servers",
    description: "Three lines of code. Your MCP server has a paywall. USDC settles on Stellar.",
    images: ["/api/og"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-gray-950 text-gray-100">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
