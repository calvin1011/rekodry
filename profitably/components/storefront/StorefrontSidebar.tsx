'use client'

import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'

type NavItem = {
  id: string
  label: string
  href: string
  isActive: boolean
}

export default function StorefrontSidebar() {
  const params = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const storeSlug = params.slug as string
  const activeTab = searchParams.get('tab') || 'orders'

  const basePath = `/store/${storeSlug}`
  const isAccountPath = pathname.startsWith(`${basePath}/account`)
  const isOrdersPath = pathname.startsWith(`${basePath}/orders`)

  const navItems: NavItem[] = [
    {
      id: 'store',
      label: 'Store Home',
      href: `${basePath}`,
      isActive: pathname === basePath,
    },
    {
      id: 'orders',
      label: 'My Orders',
      href: `${basePath}/account?tab=orders`,
      isActive: isOrdersPath || (isAccountPath && activeTab !== 'tracking'),
    },
    {
      id: 'tracking',
      label: 'Track Order',
      href: `${basePath}/account?tab=tracking`,
      isActive: isAccountPath && activeTab === 'tracking',
    },
  ]

  return (
    <div>
      <nav className="md:hidden sticky top-16 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-profit-500/20 text-profit-300 border border-profit-500/30'
                    : 'text-slate-300 hover:text-slate-100 border border-transparent'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <aside className="hidden md:flex md:fixed md:top-16 md:left-0 md:bottom-0 md:w-64 md:border-r md:border-slate-800 md:bg-slate-950">
        <div className="w-full p-6 space-y-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            Account
          </div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-profit-500/15 text-profit-300 border border-profit-500/30'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {item.isActive && (
                  <span className="text-profit-400">•</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
