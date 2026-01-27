
'use client'

import { useActionState, use } from 'react'
import { trackOrder } from '../actions'
import Link from 'next/link'

export default function TrackOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [state, action, isPending] = useActionState(trackOrder.bind(null, slug), null)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-dark rounded-2xl border border-slate-800 p-8 shadow-xl animate-slide-up">
        <div className="text-center mb-8">
          <Link href={`/store/${slug}`} className="text-emerald-500 hover:text-emerald-400 text-sm mb-4 inline-block">
            ← Back to Store
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Track Your Order</h1>
          <p className="text-slate-400">Enter your order details to see current status</p>
        </div>

        <form action={action} className="space-y-6">
          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-300 mb-1">
              Order Number
            </label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              placeholder="e.g. ORD-123456"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Searching...' : 'Track Order'}
          </button>

          <div className="text-center pt-4 border-t border-slate-800">
            <Link
              href={`/store/${slug}/portal/login`}
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}