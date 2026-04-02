"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/demo", label: "Demo" },
  { href: "/tools", label: "Tools" },
  { href: "/docs", label: "Docs" },
  { href: "/protocols", label: "Protocols" },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm transition-colors ${
            pathname === link.href
              ? "text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
