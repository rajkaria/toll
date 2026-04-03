import Link from "next/link"
import { NavLinks } from "./NavLinks"

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(16px) saturate(180%)" }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            T
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Toll<span className="text-emerald-400">pay</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  )
}
