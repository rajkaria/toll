"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/registry", label: "Registry" },
  { href: "/demo", label: "Demo" },
  { href: "/tools", label: "Tools" },
  { href: "/fund", label: "Fund" },
  { href: "/docs", label: "Docs" },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
            pathname === link.href
              ? "text-white bg-white/10 font-medium"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
