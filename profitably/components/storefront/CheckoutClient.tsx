'use client'

import React, { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link'
import AccountLoginForm from '@/app/(storefront)/store/[slug]/account/AccountLoginForm'

interface StoreSettings {
  id: string
  store_name: string
  store_slug: string
  flat_shipping_rate: number
  free_shipping_threshold: number | null
}

interface CheckoutClientProps {
  store: StoreSettings
  storeSlug: string
  prefillEmail?: string | null
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutClient({ store, storeSlug, prefillEmail = null }: CheckoutClientProps) {
  // Added updateQuantity and removeItem to the destructuring
  const { items, subtotal, updateQuantity, removeItem } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState(prefillEmail || '')
  const [name, setName] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('US')

  useEffect(() => {
    if (prefillEmail) return
    const savedEmail = localStorage.getItem('checkout_email')
    if (savedEmail && !email) {
      setEmail(savedEmail)
    }
  }, [email, prefillEmail])

  useEffect(() => {
    if (email) {
      localStorage.setItem('checkout_email', email)
    }
  }, [email])

  const shippingCost = store.free_shipping_threshold && subtotal >= store.free_shipping_threshold
    ? 0
    : store.flat_shipping_rate

  const total = subtotal + shippingCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          store_slug: storeSlug,
          customer_email: email,
          shipping_address: {
            name,
            line1,
            line2: line2 || null,
            city,
            state,
            postal_code: postalCode,
            country,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process checkout')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Your cart is empty</h2>
          <p className="text-slate-400 mb-8">Add some items to proceed with checkout.</p>
          <Link
            href={`/store/${storeSlug}`}
            className="inline-block px-6 py-3 rounded-xl font-semibold
                     bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/50
                     hover:shadow-glow-profit-lg hover:scale-105
                     transition-smooth"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-8">
          <span className="gradient-text">Checkout</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Form Column */}
          <div className="glass-dark rounded-2xl p-6">
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="text-lg font-semibold text-slate-100 mb-2">Already bought here?</h2>
              <p className="text-sm text-slate-400 mb-4">
                Sign in to view order history and tracking. New customers can continue checkout below.
              </p>
              <AccountLoginForm
                storeSlug={storeSlug}
                compact
                redirectTo={`/store/${storeSlug}/checkout`}
              />
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-6">Shipping Information</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="line1" className="block text-sm font-medium text-slate-300 mb-2">
                  Address Line 1 <span className="text-red-400">*</span>
                </label>
                <input
                  id="line1"
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label htmlFor="line2" className="block text-sm font-medium text-slate-300 mb-2">
                  Address Line 2
                </label>
                <input
                  id="line2"
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-300 mb-2">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    maxLength={2}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-slate-300 mb-2">
                    ZIP Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-2">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                  >
                    <option value="US">United States</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 rounded-xl font-semibold text-lg
                         bg-gradient-profit text-white
                         shadow-lg shadow-profit-500/50
                         hover:shadow-glow-profit-lg hover:scale-[1.02]
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-smooth"
              >
                {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </button>
            </form>
          </div>

          {/* Order Summary Column */}
          <div className="glass-dark rounded-2xl p-6 h-fit sticky top-8">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Order Summary</h2>

            {/* Interactive Items List */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details & Controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-medium text-slate-200 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm font-semibold text-slate-100 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.price)} each
                      </p>

                      <div className="flex items-center gap-3">
                        {/* Quantity Pill */}
                        <div className="flex items-center h-6 rounded-md bg-slate-900 border border-slate-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs text-slate-200 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.max_quantity}
                            className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-100 font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="text-slate-100 font-medium">
                  {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-700">
                <span className="text-base font-semibold text-slate-100">Total</span>
                <span className="text-xl font-bold gradient-text">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure checkout powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}