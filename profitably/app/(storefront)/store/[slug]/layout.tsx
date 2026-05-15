import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StorefrontHeader from '@/components/storefront/StorefrontHeader'
import StorefrontSidebar from '@/components/storefront/StorefrontSidebar'
import ProductRequestDialog from '@/components/storefront/ProductRequestDialog'
import CartStoreSlugSync from '@/components/storefront/CartStoreSlugSync'
import { StorefrontMobileProvider } from '@/components/storefront/StorefrontMobileContext'
import React from "react";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !store) {
    notFound()
  }

  return (
    <StorefrontMobileProvider>
      <CartStoreSlugSync storeSlug={slug} />
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <ProductRequestDialog storeSlug={slug} />
        <StorefrontHeader store={store} slug={slug} />

        <div className="flex-1">
          <StorefrontSidebar />
        <main className="flex-1 md:pl-64">
          {children}
        </main>
      </div>

      <footer className="bg-slate-950 border-t border-slate-800/50 mt-auto md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 mb-4">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.store_name} className="h-10 w-auto" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-profit-500 to-profit-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{store.store_name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-xl font-bold text-slate-100">{store.store_name}</span>
              </Link>
              {store.store_description && (
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {store.store_description}
                </p>
              )}
              {store.ships_from_city && store.ships_from_state && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ships from {store.ships_from_city}, {store.ships_from_state}</span>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-5 uppercase tracking-wider">Shop</h4>
              <ul className="space-y-3">
                <li>
                  <Link href={`/store/${slug}`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/wishlist`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    My Wishlist
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/account`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/account?tab=tracking`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    Track Order
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-5 uppercase tracking-wider">Policies</h4>
              <ul className="space-y-3">
                <li>
                  <Link href={`/store/${slug}/policies/returns`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/policies/shipping`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/policies/terms`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${slug}/help`} className="text-slate-400 hover:text-profit-400 text-sm transition-colors">
                    Help & FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-5 uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-4">
                {store.business_email && (
                  <li>
                    <a
                      href={`mailto:${store.business_email}`}
                      className="flex items-center gap-3 text-slate-400 hover:text-profit-400 text-sm transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/50 group-hover:bg-profit-500/20 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="break-all">{store.business_email}</span>
                    </a>
                  </li>
                )}
                {store.business_phone && (
                  <li>
                    <a
                      href={`tel:${store.business_phone}`}
                      className="flex items-center gap-3 text-slate-400 hover:text-profit-400 text-sm transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/50 group-hover:bg-profit-500/20 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <span>{store.business_phone}</span>
                    </a>
                  </li>
                )}
                <li className="pt-2">
                  <Link
                    href={`/store/${slug}/contact`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-profit-600 hover:bg-profit-500 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Send Message
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Copyright */}
              <p className="text-slate-500 text-sm">
                © {new Date().getFullYear()} {store.store_name}. All rights reserved.
              </p>

              {/* Trust Badges */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Buyer Protection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 font-medium">Visa</span>
                  <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 font-medium">Mastercard</span>
                  <span className="px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 font-medium">Amex</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </StorefrontMobileProvider>
  )
}