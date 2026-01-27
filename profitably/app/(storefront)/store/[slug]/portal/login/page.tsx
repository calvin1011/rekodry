
'use client'

import { useActionState, use } from 'react'
import { sendLoginLink } from '../actions'
import Link from 'next/link'

export default function PortalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [state, action, isPending] = useActionState(sendLoginLink.bind(null, slug), null)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-dark rounded-2xl border border-slate-800 p-8 shadow-xl animate-slide-up">
        <div className="text-center mb-8">
          <Link href={`/store/${slug}`} className="text-emerald-500 hover:text-emerald-400 text-sm mb-4 inline-block">
            ← Back to Store
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Customer Portal</h1>
          <p className="text-slate-400">Sign in to view your order history</p>
        </div>

        {state?.success ? (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/40">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-100">Check your email</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We've sent a login link to your email address.<br/>
              Click the link to sign in instantly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-emerald-400 hover:text-emerald-300 text-sm mt-4 inline-block font-medium"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form action={action} className="space-y-6">
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
              {isPending ? 'Sending Link...' : 'Send Login Link'}
            </button>

            <div className="text-center pt-4 border-t border-slate-800">
              <Link
                href={`/store/${slug}/portal/track`}
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Just want to track an order?
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}