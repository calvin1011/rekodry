'use client'

import { useActionState } from 'react'
import { loginWithEmail } from '../actions'
import Link from 'next/link'

interface AccountLoginFormProps {
  storeSlug: string
  compact?: boolean
  redirectTo?: string
}

export default function AccountLoginForm({
  storeSlug,
  compact = false,
  redirectTo,
}: AccountLoginFormProps) {
  const [state, action, isPending] = useActionState(loginWithEmail.bind(null, storeSlug), null)

  return (
    <div className={compact ? '' : 'min-h-screen bg-gradient-dark flex items-center justify-center p-4'}>
      <div className={`${compact ? '' : 'max-w-md'} w-full glass-dark rounded-2xl border border-slate-800 p-8 shadow-xl`}>
        <div className="text-center mb-8">
          {!compact && (
            <Link href={`/store/${storeSlug}`} className="text-profit-400 hover:text-profit-300 text-sm mb-4 inline-block">
              ← Back to Store
            </Link>
          )}
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign In</h1>
          <p className="text-slate-400">Access your order history</p>
        </div>

        <form action={action} className="space-y-6">
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
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
            {isPending ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Just tracking one order?</p>
            <Link
              href={`/store/${storeSlug}/account?tab=tracking`}
              className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
            >
              Track order as guest
            </Link>
          </div>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Your account is automatically created when you place your first order.
        </p>
      </div>
    </div>
  )
}