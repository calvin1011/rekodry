'use client'

import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

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
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const basePath = `/store/${storeSlug}`
  const isAccountPath = pathname.startsWith(`${basePath}/account`)
  const isOrdersPath = pathname.startsWith(`${basePath}/orders`)

  const isHelpPath = pathname.startsWith(`${basePath}/help`)
  const isContactPath = pathname.startsWith(`${basePath}/contact`)

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
    {
      id: 'help',
      label: 'Help & FAQ',
      href: `${basePath}/help`,
      isActive: isHelpPath,
    },
    {
      id: 'contact',
      label: 'Contact Us',
      href: `${basePath}/contact`,
      isActive: isContactPath,
    },
  ]

  return (
    <div>
      <div className="md:hidden sticky top-16 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="text-sm uppercase tracking-widest text-slate-500">Account</div>
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-slate-200 border border-slate-700
                     hover:bg-slate-800 transition-smooth"
          >
            Menu
          </button>
        </div>
      </div>

      <div className={`md:hidden fixed inset-0 z-50 ${isMobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-slate-950 border-r border-slate-800 transform transition-transform ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="text-sm uppercase tracking-widest text-slate-500">Account</div>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-smooth"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-profit-500/15 text-profit-300 border border-profit-500/30'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <span>{item.label}</span>
                {item.isActive && <span className="text-profit-400">•</span>}
              </Link>
            ))}
          </div>
        </aside>
      </div>

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
