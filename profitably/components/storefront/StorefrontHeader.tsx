'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartIcon from '@/components/storefront/CartIcon'
import { useStorefrontMobile } from '@/components/storefront/StorefrontMobileContext'

type Store = {
  logo_url: string | null
  store_name: string
  ships_from_city?: string | null
  ships_from_state?: string | null
}

export default function StorefrontHeader({
  store,
  slug,
}: {
  store: Store
  slug: string
}) {
  const router = useRouter()
  const { openMobileMenu } = useStorefrontMobile()
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/store/${slug}?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, slug, router])

  const shipsFrom = store.ships_from_city && store.ships_from_state 
    ? `${store.ships_from_city}, ${store.ships_from_state}`
    : null

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-950/98 backdrop-blur-md shadow-lg shadow-black/20' 
          : 'bg-slate-900/95 backdrop-blur-sm'
      } border-b border-slate-800/80`}
    >
      {/* Top bar with delivery info (desktop only) */}
      <div className={`hidden lg:block border-b border-slate-800/50 transition-all duration-300 ${
        isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 text-xs">
            <div className="flex items-center gap-6">
              {shipsFrom && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ships from <span className="text-slate-300 font-medium">{shipsFrom}</span></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-3.5 h-3.5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure checkout</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <Link href={`/store/${slug}/help`} className="hover:text-profit-400 transition-colors">
                Help
              </Link>
              <Link href={`/store/${slug}/account?tab=tracking`} className="hover:text-profit-400 transition-colors">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center h-14 gap-3">
          <button
            type="button"
            onClick={openMobileMenu}
            className="p-2 -ml-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-all active:scale-95"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link
            href={`/store/${slug}`}
            className="flex items-center gap-2 shrink-0"
          >
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.store_name}
                className={`transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'} w-auto object-contain`}
              />
            ) : (
              <span className={`font-bold text-slate-100 transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
                {store.store_name}
              </span>
            )}
          </Link>

          <div className="flex-1" />

          <Link
            href={`/store/${slug}/account`}
            className="p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-all"
            aria-label="Account"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
          <CartIcon />
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <div className={`flex items-center bg-slate-800/60 border rounded-xl transition-all duration-200 ${
              searchFocused 
                ? 'border-profit-500/50 ring-2 ring-profit-500/20' 
                : 'border-slate-700/50'
            }`}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search products..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2.5 text-slate-400 hover:text-profit-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Desktop Header */}
        <div className={`hidden md:flex items-center gap-6 transition-all duration-300 ${
          isScrolled ? 'h-14' : 'h-16'
        }`}>
          {/* Logo */}
          <Link
            href={`/store/${slug}`}
            className="flex items-center gap-3 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-profit-500 text-slate-100 hover:text-profit-400 transition-colors group"
          >
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.store_name}
                className={`transition-all duration-300 ${isScrolled ? 'h-9' : 'h-11'} w-auto object-contain`}
              />
            ) : (
              <div className={`flex items-center justify-center rounded-xl bg-gradient-profit transition-all duration-300 ${
                isScrolled ? 'w-9 h-9' : 'w-11 h-11'
              }`}>
                <span className={`text-white font-bold transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
                  {store.store_name.charAt(0)}
                </span>
              </div>
            )}
            <span className={`font-bold transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
              {store.store_name}
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            <Link
              href={`/store/${slug}`}
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
            >
              All Products
            </Link>
            <Link
              href={`/store/${slug}/wishlist`}
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
            >
              Wishlist
            </Link>
          </nav>

          {/* Search Bar - Prominent Center */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
            <div className={`flex items-center bg-slate-800/50 border rounded-xl transition-all duration-200 search-glow ${
              searchFocused 
                ? 'border-profit-500/60 bg-slate-800/80' 
                : 'border-slate-700/60 hover:border-slate-600'
            }`}>
              <div className="pl-4 text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for products..."
                className="flex-1 bg-transparent px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 mr-1 my-1 bg-gradient-profit text-white text-sm font-medium rounded-lg hover:shadow-glow-profit transition-all active:scale-95"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/store/${slug}/account`}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden xl:inline text-sm font-medium">Account</span>
            </Link>
            <div className="w-px h-6 bg-slate-700/50" />
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  )
}
