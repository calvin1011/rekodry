'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Item {
  id: string
  name: string
  purchase_price: number
  quantity_on_hand: number
  category: string | null
}

interface RecordSaleModalProps {
  isOpen: boolean
  onClose: () => void
  items: Item[]
}

export default function RecordSaleModal({ isOpen, onClose, items }: RecordSaleModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
    
  const [selectedItemId, setSelectedItemId] = useState('')
  const [platform, setPlatform] = useState<'amazon' | 'ebay' | 'facebook' | 'mercari' | 'poshmark' | 'other'>('amazon')
  const [salePrice, setSalePrice] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [quantitySold, setQuantitySold] = useState('1')
  const [platformFees, setPlatformFees] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [otherFees, setOtherFees] = useState('')
  const [notes, setNotes] = useState('')

  // get selected item details
  const selectedItem = items.find(item => item.id === selectedItemId)

  // calculate profit preview
  const salePriceNum = parseFloat(salePrice) || 0
  const quantityNum = parseInt(quantitySold) || 1
  const feesNum = (parseFloat(platformFees) || 0) + (parseFloat(shippingCost) || 0) + (parseFloat(otherFees) || 0)
  const purchasePrice = selectedItem?.purchase_price || 0
  const grossProfit = (salePriceNum * quantityNum) - (purchasePrice * quantityNum)
  const netProfit = grossProfit - feesNum
  const profitMargin = salePriceNum > 0 ? (netProfit / (salePriceNum * quantityNum)) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItemId,
          platform,
          sale_price: parseFloat(salePrice),
          sale_date: saleDate,
          quantity_sold: parseInt(quantitySold),
          platform_fees: parseFloat(platformFees) || 0,
          shipping_cost: parseFloat(shippingCost) || 0,
          other_fees: parseFloat(otherFees) || 0,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record sale')
      }
      
      onClose()
      router.refresh()
        
      setSelectedItemId('')
      setPlatform('amazon')
      setSalePrice('')
      setSaleDate(new Date().toISOString().split('T')[0])
      setQuantitySold('1')
      setPlatformFees('')
      setShippingCost('')
      setOtherFees('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
        
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar glass-dark rounded-2xl shadow-glass-lg animate-slide-up">
        <div className="p-6">
            
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Record Sale</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700
                       hover:bg-slate-700 transition-smooth flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">You don&#39;t have any items in inventory yet.</p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-medium
                         bg-slate-800 text-slate-100 border border-slate-700
                         hover:bg-slate-700 hover:border-slate-600
                         transition-smooth"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label htmlFor="item" className="block text-sm font-medium text-slate-300 mb-2">
                  Select Item <span className="text-red-400">*</span>
                </label>
                <select
                  id="item"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                >
                  <option value="">Choose an item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.quantity_on_hand} available ({formatCurrency(item.purchase_price)} each)
                    </option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Purchase Price</p>
                      <p className="text-slate-100 font-medium">{formatCurrency(selectedItem.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Available</p>
                      <p className="text-slate-100 font-medium">{selectedItem.quantity_on_hand} units</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-slate-300 mb-2">
                    Platform <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as 'amazon' | 'ebay' | 'facebook' | 'mercari' | 'poshmark' | 'other')}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                  >
                    <option value="amazon">Amazon</option>
                    <option value="ebay">eBay</option>
                    <option value="facebook">Facebook Marketplace</option>
                    <option value="mercari">Mercari</option>
                    <option value="poshmark">Poshmark</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="salePrice" className="block text-sm font-medium text-slate-300 mb-2">
                    Sale Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="89.99"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-2">
                    Quantity Sold <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedItem?.quantity_on_hand || 999}
                    value={quantitySold}
                    onChange={(e) => setQuantitySold(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label htmlFor="saleDate" className="block text-sm font-medium text-slate-300 mb-2">
                    Sale Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="saleDate"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Fees & Costs (Optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>
                    <label htmlFor="platformFees" className="block text-xs text-slate-400 mb-2">
                      Platform Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        id="platformFees"
                        type="number"
                        step="0.01"
                        min="0"
                        value={platformFees}
                        onChange={(e) => setPlatformFees(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                                 text-slate-100 placeholder-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                                 transition-smooth"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="shippingCost" className="block text-xs text-slate-400 mb-2">
                      Shipping Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        id="shippingCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                                 text-slate-100 placeholder-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                                 transition-smooth"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="otherFees" className="block text-xs text-slate-400 mb-2">
                      Other Fees
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        id="otherFees"
                        type="number"
                        step="0.01"
                        min="0"
                        value={otherFees}
                        onChange={(e) => setOtherFees(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                                 text-slate-100 placeholder-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                                 transition-smooth"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedItem && salePrice && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-profit-500/10 to-profit-600/10 border border-profit-500/30">
                  <p className="text-sm text-slate-400 mb-3">Profit Preview</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Gross Profit</p>
                      <p className="text-slate-100 font-semibold">{formatCurrency(grossProfit)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Fees</p>
                      <p className="text-slate-100 font-semibold">{formatCurrency(feesNum)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Net Profit</p>
                      <p className={`font-bold ${netProfit >= 0 ? 'text-profit-400' : 'text-red-400'}`}>
                        {formatCurrency(netProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Margin</p>
                      <p className={`font-bold ${profitMargin >= 0 ? 'text-profit-400' : 'text-red-400'}`}>
                        {profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl font-medium
                           bg-slate-800 text-slate-100 border border-slate-700
                           hover:bg-slate-700 hover:border-slate-600
                           transition-smooth"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedItemId}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold
                           bg-gradient-profit text-white
                           shadow-lg shadow-profit-500/50
                           hover:shadow-glow-profit-lg hover:scale-[1.02]
                           active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-smooth"
                >
                  {loading ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}