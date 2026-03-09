'use client'

import Link from 'next/link'
import CartIcon from '@/components/storefront/CartIcon'
import { useStorefrontMobile } from '@/components/storefront/StorefrontMobileContext'

type Store = {
  logo_url: string | null
  store_name: string
}

export default function StorefrontHeader({
  store,
  slug,
}: {
  store: Store
  slug: string
}) {
  const { openMobileMenu } = useStorefrontMobile()

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: 3-column grid — hamburger left, store name center, account+cart right */}
        <div className="md:hidden grid grid-cols-3 items-center h-16 gap-2">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={openMobileMenu}
              className="p-2 -ml-2 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center min-w-0">
            <a href={`/store/${slug}`} className="text-xl font-bold text-slate-100 truncate text-center">
              {store.store_name}
            </a>
          </div>
          <div className="flex justify-end items-center gap-1">
            <Link
              href={`/store/${slug}/account`}
              className="p-2 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Account"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <CartIcon />
          </div>
        </div>

        {/* Desktop: logo + nav left, account + cart right */}
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center gap-8 min-w-0">
            <a href={`/store/${slug}`} className="flex items-center gap-3 shrink-0">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.store_name}
                  className="h-10 w-auto object-contain"
                />
              )}
              <span className="text-xl font-bold text-slate-100">
                {store.store_name}
              </span>
            </a>
            <nav className="flex items-center gap-6 shrink-0">
              <Link
                href={`/store/${slug}`}
                className="text-slate-300 hover:text-slate-100 transition-colors text-sm font-medium"
              >
                All Products
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href={`/store/${slug}/account`}
              className="p-2 text-slate-300 hover:text-slate-100 transition-colors"
              aria-label="Account"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  )
}
