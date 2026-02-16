import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CartIcon from '@/components/storefront/CartIcon'
import StorefrontSidebar from '@/components/storefront/StorefrontSidebar'
import ProductRequestDialog from '@/components/storefront/ProductRequestDialog'
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <ProductRequestDialog storeSlug={slug} />
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href={`/store/${slug}`} className="flex items-center gap-3">
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

              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href={`/store/${slug}`}
                  className="text-slate-300 hover:text-slate-100 transition-colors text-sm font-medium"
                >
                  All Products
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <CartIcon />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <StorefrontSidebar />
        <main className="flex-1 md:pl-64">
          {children}
        </main>
      </div>

      <footer className="bg-slate-950 border-t border-slate-800/50 mt-auto md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-100 mb-4">
                {store.store_name}
              </h3>
              {store.store_description && (
                <p className="text-slate-400 text-sm leading-relaxed">
                  {store.store_description}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Policies</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={`/store/${slug}/policies/returns`}
                    className="text-slate-400 hover:text-profit-400 text-sm transition-colors"
                  >
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/store/${slug}/policies/shipping`}
                    className="text-slate-400 hover:text-profit-400 text-sm transition-colors"
                  >
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/store/${slug}/policies/terms`}
                    className="text-slate-400 hover:text-profit-400 text-sm transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={`mailto:${store.business_email || 'calvinssendawula@gmail.com'}`}
                    className="text-slate-400 hover:text-profit-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {store.business_email || 'calvinssendawula@gmail.com'}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${store.business_phone || '9036347794'}`}
                    className="text-slate-400 hover:text-profit-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {store.business_phone || '(903) 634-7794'}
                  </a>
                </li>
                {store.ships_from_city && store.ships_from_state && (
                  <li className="text-slate-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ships from {store.ships_from_city}, {store.ships_from_state}
                  </li>
                )}
                <li className="pt-2">
                  <Link
                    href={`/store/${slug}/contact`}
                    className="inline-block px-4 py-2 bg-profit-600 hover:bg-profit-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {store.store_name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}