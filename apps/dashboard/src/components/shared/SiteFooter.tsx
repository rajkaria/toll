import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-600">
          Built on Stellar &middot; Stellar Hacks 2026
        </p>
        <div className="flex items-center gap-6">
          <Link href="/docs" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Docs
          </Link>
          <Link href="/tools" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Tools
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
