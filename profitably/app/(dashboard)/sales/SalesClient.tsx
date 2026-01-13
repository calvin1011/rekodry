'use client'

import { useState } from 'react'
import RecordSaleModal from './RecordSaleModal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Item {
  id: string
  name: string
  purchase_price: number
  category: string | null
  image_url: string | null
}

interface Sale {
  id: string
  item_id: string
  platform: string
  sale_price: number
  sale_date: string
  quantity_sold: number
  platform_fees: number
  shipping_cost: number
  other_fees: number
  gross_profit: number
  net_profit: number
  profit_margin: number
  notes: string | null
  created_at: string
  items: Item
}

interface AvailableItem {
  id: string
  name: string
  purchase_price: number
  quantity_on_hand: number
  category: string | null
}

interface SalesClientProps {
  initialSales: Sale[]
  items: AvailableItem[]
}

export default function SalesClient({ initialSales, items }: SalesClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

  // filter sales by platform
  const filteredSales = filterPlatform === 'all'
    ? initialSales
    : initialSales.filter(sale => sale.platform === filterPlatform)

  // calculate totals
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity_sold), 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.net_profit, 0)
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.quantity_sold, 0)
  const avgProfitMargin = filteredSales.length > 0
    ? filteredSales.reduce((sum, sale) => sum + sale.profit_margin, 0) / filteredSales.length
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

  const getPlatformIcon = (platform: string) => {
    // simple text badges for now - will add actual icons later
    return platform.charAt(0).toUpperCase() + platform.slice(1)
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Sales</span>
          </h1>
          <p className="text-slate-400">Track your sales and profit across all platforms</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-down" style={{ animationDelay: '0.1s' }}>
          {/* Platform Filter */}
          <div className="flex-1">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                       transition-smooth"
            >
              <option value="all">All Platforms</option>
              <option value="amazon">Amazon</option>
              <option value="ebay">eBay</option>
              <option value="facebook">Facebook Marketplace</option>
              <option value="mercari">Mercari</option>
              <option value="poshmark">Poshmark</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold
                     bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/50
                     hover:shadow-glow-profit-lg hover:scale-105
                     active:scale-95
                     transition-smooth inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Sale
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue */}
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalRevenue)}</p>
          </div>

          {/* Total Profit */}
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Profit</p>
            <p className="text-2xl font-bold gradient-text">{formatCurrency(totalProfit)}</p>
          </div>

          {/* Total Sales */}
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-400 text-sm mb-1">Items Sold</p>
            <p className="text-2xl font-bold text-slate-100">{totalSales}</p>
          </div>

          {/* Avg Profit Margin */}
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-slate-400 text-sm mb-1">Avg Margin</p>
            <p className="text-2xl font-bold text-slate-100">{avgProfitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {filterPlatform === 'all' ? 'No sales yet' : `No sales on ${filterPlatform}`}
            </h3>
            <p className="text-slate-400 mb-6">
              {filterPlatform === 'all'
                ? 'Record your first sale to start tracking profit'
                : 'Try selecting a different platform or record a new sale'}
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">Add items to your inventory first before recording sales</p>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
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
                Record First Sale
              </button>
            )}
          </div>
        ) : (
          // Sales Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSales.map((sale, index) => (
              <div
                key={sale.id}
                className="glass-dark rounded-xl p-6 hover:shadow-glass-lg transition-smooth animate-slide-up"
                style={{ animationDelay: `${0.6 + index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2 line-clamp-2">
                      {sale.items.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-lg border ${getPlatformColor(sale.platform)}`}>
                        {getPlatformIcon(sale.platform)}
                      </span>
                      {sale.items.category && (
                        <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400">
                          {sale.items.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Sale Date</span>
                    <span className="text-slate-100 font-medium">{formatDate(sale.sale_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Quantity</span>
                    <span className="text-slate-100 font-medium">{sale.quantity_sold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Sale Price</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(sale.sale_price)}</span>
                  </div>
                  {(sale.platform_fees > 0 || sale.shipping_cost > 0 || sale.other_fees > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Fees</span>
                      <span className="text-red-400 font-medium">
                        -{formatCurrency(sale.platform_fees + sale.shipping_cost + sale.other_fees)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profit Section */}
                <div className="pt-4 border-t border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Net Profit</span>
                    <span className={`text-xl font-bold ${sale.net_profit >= 0 ? 'gradient-text' : 'text-red-400'}`}>
                      {formatCurrency(sale.net_profit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Profit Margin</span>
                    <span className={`text-sm font-semibold ${sale.profit_margin >= 0 ? 'text-profit-400' : 'text-red-400'}`}>
                      {sale.profit_margin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {sale.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{sale.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <RecordSaleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} items={items} />
    </div>
  )
}