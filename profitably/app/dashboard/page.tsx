import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', user.id)

  const totalItems = items?.length || 0
  const totalQuantity = items?.reduce((sum, item) => sum + item.quantity_on_hand, 0) || 0
  const inventoryValue = items?.reduce((sum, item) => sum + (item.purchase_price * item.quantity_on_hand), 0) || 0
  const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity_sold), 0) || 0
  const totalProfit = sales?.reduce((sum, sale) => sum + sale.net_profit, 0) || 0
  const totalSales = sales?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0
  const avgProfitMargin = sales && sales.length > 0 
    ? sales.reduce((sum, sale) => sum + sale.profit_margin, 0) / sales.length 
    : 0

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{profile?.full_name || 'there'}</span>!
          </h1>
          <p className="text-slate-400">Here&#39;s your profit overview</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Profit Card */}
          <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Total Profit</p>
              <div className="w-10 h-10 rounded-full bg-profit-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold gradient-text mb-2">{formatCurrency(totalProfit)}</p>
            <p className="text-xs text-slate-500">
              {totalSales > 0 ? `From ${totalSales} sales` : 'No sales yet'}
            </p>
          </div>

          {/* Total Items Card */}
          <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Total Items</p>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-100 mb-2">{totalItems}</p>
            <p className="text-xs text-slate-500">
              {totalQuantity} units in stock
            </p>
          </div>

          <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-100 mb-2">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500">All-time sales</p>
          </div>

          {/* Profit Margin Card */}
          <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-sm font-medium">Avg Profit Margin</p>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-100 mb-2">{avgProfitMargin.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Average across all sales</p>
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-20 h-20 bg-profit-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3">Start tracking your profits</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Add your first inventory item to begin tracking purchases, sales, and profit across all your platforms.
            </p>
            <Link
              href="/inventory"
              className="px-8 py-3 rounded-xl font-semibold
                       bg-gradient-profit text-white
                       shadow-lg shadow-profit-500/50
                       hover:shadow-glow-profit-lg hover:scale-105
                       active:scale-95
                       transition-smooth inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Item
            </Link>
          </div>
        ) : (
          // Quick Actions & Recent Activity
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xl font-bold text-slate-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/inventory"
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700
                           hover:bg-slate-700/50 hover:border-slate-600 transition-smooth group"
                >
                  <div className="w-12 h-12 rounded-xl bg-profit-500/20 flex items-center justify-center
                                group-hover:bg-profit-500/30 transition-smooth">
                    <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">Add New Item</p>
                    <p className="text-sm text-slate-400">Add inventory to track</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-smooth" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/inventory"
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700
                           hover:bg-slate-700/50 hover:border-slate-600 transition-smooth group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center
                                group-hover:bg-blue-500/30 transition-smooth">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">View Inventory</p>
                    <p className="text-sm text-slate-400">{totalItems} items to manage</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-smooth" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-xl font-bold text-slate-100 mb-4">Inventory Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Inventory Value</span>
                  <span className="text-xl font-bold gradient-text">{formatCurrency(inventoryValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Items in Stock</span>
                  <span className="text-xl font-bold text-slate-100">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Unique Products</span>
                  <span className="text-xl font-bold text-slate-100">{totalItems}</span>
                </div>
                {totalSales > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Items Sold</span>
                      <span className="text-xl font-bold text-purple-400">{totalSales}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}