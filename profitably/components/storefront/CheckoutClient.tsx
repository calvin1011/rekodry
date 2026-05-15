'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AccountLoginForm from '@/app/(storefront)/store/[slug]/account/AccountLoginForm'
import { RemoteImage } from '@/components/media/RemoteImage'

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
  const router = useRouter()
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
        const url = data.url as string
        if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('//')) {
          window.location.replace(url)
        } else {
          router.push(url)
        }
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

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-dark py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Steps */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-6">
            Secure Checkout
          </h1>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-profit-500 text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-profit-400 hidden sm:inline">Shipping</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-slate-500 hidden sm:inline">Payment</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm font-medium text-slate-500 hidden sm:inline">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Shipping Form Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Login Prompt */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-profit-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-100 mb-1">Returning customer?</h2>
                  <p className="text-sm text-slate-400 mb-4">
                    Sign in for faster checkout and order tracking.
                  </p>
                  <AccountLoginForm
                    storeSlug={storeSlug}
                    compact
                    redirectTo={`/store/${storeSlug}/checkout`}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Form */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Shipping Address</h2>
                  <p className="text-sm text-slate-500">Where should we deliver your order?</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500/50 focus:border-profit-500/50
                               transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500/50 focus:border-profit-500/50
                               transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">We&apos;ll send your order confirmation here</p>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label htmlFor="line1" className="block text-sm font-medium text-slate-300 mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <input
                      id="line1"
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500/50 focus:border-profit-500/50
                               transition-all"
                      placeholder="123 Main St"
                    />
                  </div>
                
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

              <p className="text-slate-500 text-xs">
                If your shipping address is wrong, you have about 30 minutes to an hour to request a change. We ship orders out quickly, so contact us right away if you need to update it.
              </p>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-full px-6 py-4 rounded-xl font-semibold text-lg
                         bg-gradient-profit text-white
                         shadow-lg shadow-profit-500/50
                         hover:shadow-glow-profit-lg hover:scale-[1.02]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-smooth"
              >
                {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
              </motion.button>
            </form>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 sticky top-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-100">Order Summary</h2>
                <span className="text-sm text-slate-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <RemoteImage
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium text-slate-200">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-200 line-clamp-1 mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-5 h-5 rounded bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors flex items-center justify-center text-xs"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.max_quantity}
                            className="w-5 h-5 rounded bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors flex items-center justify-center text-xs disabled:opacity-30"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-1"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-slate-100">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 py-4 border-y border-slate-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-profit-400 font-medium' : 'text-slate-200'}>
                    {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <span className="text-base font-semibold text-slate-100">Total</span>
                <span className="text-2xl font-bold text-slate-100">{formatCurrency(total)}</span>
              </div>

              {/* Trust Signals */}
              <div className="pt-4 border-t border-slate-700/50 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
                    <svg className="w-4 h-4 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-slate-400">SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
                    <svg className="w-4 h-4 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs text-slate-400">Protected</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
                    <svg className="w-4 h-4 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-xs text-slate-400">Stripe Pay</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
                    <svg className="w-4 h-4 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs text-slate-400">Easy Returns</span>
                  </div>
                </div>
                
                <p className="text-xs text-center text-slate-500">
                  Your payment info is encrypted and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}