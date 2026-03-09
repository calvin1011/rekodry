'use client'

import CountUp from './CountUp'

interface DashboardStatsClientProps {
  totalProfit: number
  totalRevenue: number
  totalItems: number
  avgProfitMargin: number
  inventoryValue: number
  totalSalesCount: number
  totalQuantity: number
}

export default function DashboardStatsClient({
  totalProfit,
  totalRevenue,
  totalItems,
  avgProfitMargin,
  inventoryValue,
  totalSalesCount,
  totalQuantity,
}: DashboardStatsClientProps) {
  return (
    <>
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
          <p className="text-3xl font-bold gradient-text mb-2">
            <CountUp to={totalProfit} prefix="$" duration={1} />
          </p>
          <p className="text-xs text-slate-500">
            {totalSalesCount > 0 ? `From ${totalSalesCount} sales` : 'No sales yet'}
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
          <p className="text-3xl font-bold text-slate-100 mb-2">
            <CountUp to={totalItems} duration={1} />
          </p>
          <p className="text-xs text-slate-500">
            {totalQuantity} units in stock
          </p>
        </div>

        {/* Total Revenue Card */}
        <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-100 mb-2">
            <CountUp to={totalRevenue} prefix="$" duration={1} />
          </p>
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
          <p className="text-3xl font-bold text-slate-100 mb-2">
            <CountUp to={avgProfitMargin} suffix="%" duration={1} decimals={1} />
          </p>
          <p className="text-xs text-slate-500">Average across all sales</p>
        </div>
      </div>
    </>
  )
}

export function InventoryValueDisplay({ value, totalQuantity }: { value: number; totalQuantity: number }) {
  return (
    <div className="mt-6 pt-6 border-t border-slate-700">
      <h4 className="text-sm font-medium text-slate-400 mb-3">Inventory Value</h4>
      <p className="text-2xl font-bold gradient-text mb-1">
        <CountUp to={value} prefix="$" duration={1} />
      </p>
      <p className="text-xs text-slate-500">{totalQuantity} units in stock</p>
    </div>
  )
}
