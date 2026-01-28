'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { trackOrder } from '../actions'

interface TrackOrderFormProps {
  storeSlug: string
}

export default function TrackOrderForm({ storeSlug }: TrackOrderFormProps) {
  const [state, action, isPending] = useActionState(trackOrder.bind(null, storeSlug), null)

  return (
    <div className="glass-dark rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Track Your Order</h2>
        <p className="text-slate-400 text-sm">
          Enter your order number and email to see the latest status.
        </p>
      </div>

      <form action={action} className="space-y-5">
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
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100
                     focus:ring-2 focus:ring-profit-500 focus:border-transparent outline-none transition-all
                     placeholder:text-slate-600"
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
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100
                     focus:ring-2 focus:ring-profit-500 focus:border-transparent outline-none transition-all
                     placeholder:text-slate-600"
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
          className="w-full bg-gradient-profit text-white font-semibold py-2.5 rounded-lg
                   transition-all shadow-lg shadow-profit-900/20
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-profit-900/40"
        >
          {isPending ? 'Searching...' : 'Track Order'}
        </button>

        <div className="text-center pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400 mb-2">Have an account?</p>
          <Link
            href={`/store/${storeSlug}/account?tab=orders`}
            className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
          >
            Sign in to view all orders
          </Link>
        </div>
      </form>
    </div>
  )
}
