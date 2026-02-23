import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-profit-500/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-profit-600/10 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-profit-400/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold">
          <span className="gradient-text">Rekodry</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/30 hover:shadow-glow-profit-lg hover:scale-105
                     transition-smooth"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-profit-500/10 border border-profit-500/20 mb-8 animate-slide-down">
            <span className="w-2 h-2 rounded-full bg-profit-400 animate-pulse"></span>
            <span className="text-sm text-profit-300">For Resellers & Store Owners</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-slide-down" style={{ animationDelay: '0.1s' }}>
            The All-in-One Platform for{' '}
            <span className="gradient-text">Reselling Success</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-slide-down" style={{ animationDelay: '0.2s' }}>
            Track inventory, monitor profits, and launch your own branded storefront, all from one powerful dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-down" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-profit text-white
                       shadow-lg shadow-profit-500/50 hover:shadow-glow-profit-lg hover:scale-105
                       transition-smooth"
            >
              Start Selling Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-slate-800/50 text-slate-100
                       border border-slate-700 hover:bg-slate-700 hover:border-slate-600
                       transition-smooth"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {/* Feature 1 */}
          <div className="glass-dark rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-14 h-14 rounded-xl bg-profit-500/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Inventory Management</h3>
            <p className="text-slate-400">
              Track every item you buy and sell. Know your stock levels, costs, and where you sourced each product.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-dark rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-14 h-14 rounded-xl bg-profit-500/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Profit Analytics</h3>
            <p className="text-slate-400">
              See your true profits after fees, shipping, and costs. Understand what&apos;s making you money.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-dark rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-14 h-14 rounded-xl bg-profit-500/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Your Own Storefront</h3>
            <p className="text-slate-400">
              Launch a beautiful, branded online store. Accept payments with Stripe. No coding required.
            </p>
          </div>
        </div>

        {/* Buyer Notice */}
        <div className="mt-20 text-center animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="inline-block glass-dark rounded-2xl px-8 py-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Looking to shop?</p>
            <p className="text-slate-300">
              If you&apos;re a customer looking for a store, visit{' '}
              <span className="text-profit-400 font-medium">rekodry.com/store/[store-name]</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Rekodry. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="mailto:support@rekodry.com" className="hover:text-slate-300 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}