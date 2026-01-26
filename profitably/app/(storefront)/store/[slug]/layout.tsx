import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CartIcon from '@/components/storefront/CartIcon'
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
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href={`/store/${slug}`} className="flex items-center gap-3">
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
              </Link>

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

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-slate-100 mb-4">
                {store.store_name}
              </h3>
              {store.store_description && (
                <p className="text-slate-400 text-sm">
                  {store.store_description}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-4">Policies</h4>
              <ul className="space-y-2">
                {store.return_policy && (
                  <li>
                    <Link
                      href={`/store/${slug}/policies/returns`}
                      className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                    >
                      Return Policy
                    </Link>
                  </li>
                )}
                {store.shipping_policy && (
                  <li>
                    <Link
                      href={`/store/${slug}/policies/shipping`}
                      className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                    >
                      Shipping Policy
                    </Link>
                  </li>
                )}
                {store.terms_of_service && (
                  <li>
                    <Link
                      href={`/store/${slug}/policies/terms`}
                      className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-4">Contact</h4>
              <ul className="space-y-2">
                {store.business_email && (
                  <li className="text-slate-400 text-sm">
                    {store.business_email}
                  </li>
                )}
                {store.business_phone && (
                  <li className="text-slate-400 text-sm">
                    {store.business_phone}
                  </li>
                )}
                {store.ships_from_city && store.ships_from_state && (
                  <li className="text-slate-400 text-sm">
                    Ships from {store.ships_from_city}, {store.ships_from_state}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {store.store_name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}