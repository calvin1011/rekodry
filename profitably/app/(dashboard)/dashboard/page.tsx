import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import StoreVisitWidget from '@/components/dashboard/StoreVisitWidget'
import DashboardStatsClient, { InventoryValueDisplay } from '@/components/dashboard/DashboardStatsClient'
import ProfitMilestoneChecker from '@/components/dashboard/ProfitMilestoneChecker'

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
    .select(`
      *,
      items (
        id,
        name,
        category
      )
    `)
    .eq('user_id', user.id)
    .order('sale_date', { ascending: false })
    .limit(5)

  const totalItems = items?.length || 0
  const totalQuantity = items?.reduce((sum, item) => sum + item.quantity_on_hand, 0) || 0
  const inventoryValue = items?.reduce((sum, item) => sum + (item.purchase_price * item.quantity_on_hand), 0) || 0

  const { data: allSales } = await supabase
    .from('sales')
    .select('sale_price, quantity_sold, net_profit, profit_margin')
    .eq('user_id', user.id)

  const totalRevenue = allSales?.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity_sold), 0) || 0
  const totalProfit = allSales?.reduce((sum, sale) => sum + sale.net_profit, 0) || 0
  const totalSalesCount = allSales?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0
  const avgProfitMargin = allSales && allSales.length > 0 
    ? allSales.reduce((sum, sale) => sum + sale.profit_margin, 0) / allSales.length 
    : 0

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'amazon': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'ebay': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'facebook': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      case 'mercari': return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      case 'poshmark': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getPlatformName = (platform: string) => {
    return platform.charAt(0).toUpperCase() + platform.slice(1)
  }

  // Store visits: fetch store and counts for widget
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('store_slug')
    .eq('user_id', user.id)
    .single()

  const storeSlug = storeSettings?.store_slug ?? null
  let visitTodayCount = 0
  let visitTotalCount = 0
  if (storeSlug) {
    const todayUtc = new Date().toISOString().slice(0, 10)
    const { count: todayCount } = await supabase
      .from('store_visits')
      .select('*', { count: 'exact', head: true })
      .eq('store_slug', storeSlug)
      .eq('visited_date', todayUtc)
    const { count: totalCount } = await supabase
      .from('store_visits')
      .select('*', { count: 'exact', head: true })
      .eq('store_slug', storeSlug)
    visitTodayCount = todayCount ?? 0
    visitTotalCount = totalCount ?? 0
  }

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
        <ProfitMilestoneChecker currentProfit={totalProfit} />
        <DashboardStatsClient
          totalProfit={totalProfit}
          totalRevenue={totalRevenue}
          totalItems={totalItems}
          avgProfitMargin={avgProfitMargin}
          inventoryValue={inventoryValue}
          totalSalesCount={totalSalesCount}
          totalQuantity={totalQuantity}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales - Takes 2 columns */}
          <div className="lg:col-span-2 glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-100">Recent Sales</h3>
              <Link 
                href="/sales"
                className="text-sm text-profit-400 hover:text-profit-300 transition-colors"
              >
                View All →
              </Link>
            </div>

            {sales && sales.length > 0 ? (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-smooth"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-100 mb-1">{sale.items.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-lg border ${getPlatformColor(sale.platform)}`}>
                            {getPlatformName(sale.platform)}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(sale.sale_date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${sale.net_profit >= 0 ? 'text-profit-400' : 'text-red-400'}`}>
                          {formatCurrency(sale.net_profit)}
                        </p>
                        <p className="text-xs text-slate-500">{sale.profit_margin.toFixed(1)}% margin</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No sales recorded yet</p>
                <Link
                  href="/sales"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                           bg-profit-500/20 text-profit-400 border border-profit-500/30
                           hover:bg-profit-500/30 transition-smooth"
                >
                  Record First Sale
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {storeSlug && (
              <StoreVisitWidget
                storeSlug={storeSlug}
                todayCount={visitTodayCount}
                totalCount={visitTotalCount}
              />
            )}
          <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
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
                  <p className="font-semibold text-slate-100">Add Item</p>
                  <p className="text-sm text-slate-400">Add to inventory</p>
                </div>
              </Link>

              <Link
                href="/sales"
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700
                         hover:bg-slate-700/50 hover:border-slate-600 transition-smooth group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center
                              group-hover:bg-purple-500/30 transition-smooth">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">Record Sale</p>
                  <p className="text-sm text-slate-400">Log a new sale</p>
                </div>
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
                  <p className="text-sm text-slate-400">{totalItems} items</p>
                </div>
              </Link>
            </div>

            <InventoryValueDisplay value={inventoryValue} totalQuantity={totalQuantity} />
          </div>
          </div>
        </div>

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