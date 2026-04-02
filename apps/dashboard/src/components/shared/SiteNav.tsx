import Link from "next/link"
import { NavLinks } from "./NavLinks"

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          Toll<span className="text-emerald-400">.</span>
        </Link>
        <NavLinks />
      </div>
    </header>
  )
}
