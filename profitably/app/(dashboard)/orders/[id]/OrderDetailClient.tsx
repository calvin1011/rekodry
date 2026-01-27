'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Customer {
  id: string
  email: string
  full_name: string
  phone: string | null
}

interface CustomerAddress {
  id: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

interface ProductImage {
  image_url: string
  position: number
}

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  subtotal: number
  sku: string | null
  products: {
    id: string
    slug: string
    product_images: ProductImage[]
  } | null
}

interface Order {
  id: string
  order_number: string
  subtotal: number
  shipping_cost: number
  tax: number
  discount: number
  total: number
  status: string
  payment_status: string
  fulfillment_status: string | null
  tracking_number: string | null
  tracking_carrier: string | null
  tracking_url: string | null
  stripe_payment_intent_id: string | null
  notes: string | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  customers: Customer
  customer_addresses: CustomerAddress | null
  order_items: OrderItem[]
}

interface OrderDetailClientProps {
  order: Order
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter()
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [isEditingTracking, setIsEditingTracking] = useState(false)
  const [newStatus, setNewStatus] = useState(order.fulfillment_status || 'pending')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '')
  const [trackingCarrier, setTrackingCarrier] = useState(order.tracking_carrier || '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-profit-500/20 text-profit-400 border-profit-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'refunded':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getFulfillmentColor = (status: string | null) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-profit-500/20 text-profit-400 border-profit-500/30'
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getFulfillmentLabel = (status: string | null) => {
    if (!status) return 'Unfulfilled'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const handleUpdateStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orders/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          fulfillment_status: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      setIsEditingStatus(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTracking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orders/tracking', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          tracking_number: trackingNumber || null,
          tracking_carrier: trackingCarrier || null,
          tracking_url: trackingUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tracking')
      }

      setIsEditingTracking(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="gradient-text">Order {order.order_number}</span>
              </h1>
              <p className="text-slate-400">{formatDate(order.created_at)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`inline-block px-3 py-1 text-sm rounded-lg border ${getStatusColor(order.payment_status)}`}>
                {getStatusLabel(order.payment_status)}
              </span>
              <span className={`inline-block px-3 py-1 text-sm rounded-lg border ${getFulfillmentColor(order.fulfillment_status)}`}>
                {getFulfillmentLabel(order.fulfillment_status)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-dark rounded-2xl p-6 animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-6">Order Items</h2>

              <div className="space-y-4">
                {order.order_items.map((item) => {
                  const mainImage = item.products?.product_images
                    .sort((a, b) => a.position - b.position)[0]

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                        {mainImage ? (
                          <img
                            src={mainImage.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <h3 className="text-slate-100 font-medium mb-1">{item.title}</h3>
                          {item.sku && (
                            <p className="text-xs text-slate-500 mb-2">SKU: {item.sku}</p>
                          )}
                          <p className="text-sm text-slate-400">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-slate-100 font-semibold">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-100">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-slate-100">{formatCurrency(order.shipping_cost)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax</span>
                    <span className="text-slate-100">{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Discount</span>
                    <span className="text-red-400">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-slate-700">
                  <span className="text-base font-semibold text-slate-100">Total</span>
                  <span className="text-xl font-bold gradient-text">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100">Fulfillment Status</h2>
                {!isEditingStatus && (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                  >
                    Update Status
                  </button>
                )}
              </div>

              {isEditingStatus ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fulfillment Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingStatus(false)}
                      className="flex-1 px-4 py-2 rounded-xl font-medium
                               bg-slate-800 text-slate-100 border border-slate-700
                               hover:bg-slate-700 hover:border-slate-600
                               transition-smooth"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-xl font-semibold
                               bg-gradient-profit text-white
                               shadow-lg shadow-profit-500/50
                               hover:shadow-glow-profit-lg hover:scale-[1.02]
                               active:scale-[0.98]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-smooth"
                    >
                      {loading ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Current Status</span>
                    <span className={`px-2 py-1 text-xs rounded-lg border ${getFulfillmentColor(order.fulfillment_status)}`}>
                      {getFulfillmentLabel(order.fulfillment_status)}
                    </span>
                  </div>
                  {order.shipped_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Shipped Date</span>
                      <span className="text-slate-100">{formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Delivered Date</span>
                      <span className="text-slate-100">{formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100">Tracking Information</h2>
                {!isEditingTracking && (
                  <button
                    onClick={() => setIsEditingTracking(true)}
                    className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                  >
                    {order.tracking_number ? 'Update' : 'Add'} Tracking
                  </button>
                )}
              </div>

              {isEditingTracking ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Carrier
                    </label>
                    <select
                      value={trackingCarrier}
                      onChange={(e) => setTrackingCarrier(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                    >
                      <option value="">Select Carrier</option>
                      <option value="USPS">USPS</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="DHL">DHL</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="1Z999AA10123456784"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="https://tools.usps.com/go/TrackConfirmAction"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditingTracking(false)}
                      className="flex-1 px-4 py-2 rounded-xl font-medium
                               bg-slate-800 text-slate-100 border border-slate-700
                               hover:bg-slate-700 hover:border-slate-600
                               transition-smooth"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateTracking}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-xl font-semibold
                               bg-gradient-profit text-white
                               shadow-lg shadow-profit-500/50
                               hover:shadow-glow-profit-lg hover:scale-[1.02]
                               active:scale-[0.98]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-smooth"
                    >
                      {loading ? 'Saving...' : 'Save Tracking'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.tracking_number ? (
                    <>
                      {order.tracking_carrier && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Carrier</span>
                          <span className="text-slate-100">{order.tracking_carrier}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tracking Number</span>
                        <span className="text-slate-100 font-mono">{order.tracking_number}</span>
                      </div>
                      {order.tracking_url && (
                        <div className="pt-3">
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                          >
                            Track Package
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500 text-sm">No tracking information added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-xl font-bold text-slate-100 mb-6">Customer</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Name</p>
                  <p className="text-slate-100 font-medium">{order.customers.full_name}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Email</p>
                  <a
                    href={`mailto:${order.customers.email}`}
                    className="text-profit-400 hover:text-profit-300 transition-colors"
                  >
                    {order.customers.email}
                  </a>
                </div>

                {order.customers.phone && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Phone</p>
                    <a
                      href={`tel:${order.customers.phone}`}
                      className="text-profit-400 hover:text-profit-300 transition-colors"
                    >
                      {order.customers.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {order.customer_addresses && (
              <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="text-xl font-bold text-slate-100 mb-6">Shipping Address</h2>

                <div className="text-slate-300 text-sm space-y-1">
                  <p>{order.customer_addresses.address_line1}</p>
                  {order.customer_addresses.address_line2 && (
                    <p>{order.customer_addresses.address_line2}</p>
                  )}
                  <p>
                    {order.customer_addresses.city}, {order.customer_addresses.state}{' '}
                    {order.customer_addresses.postal_code}
                  </p>
                  <p>{order.customer_addresses.country}</p>
                </div>
              </div>
            )}

            <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="text-xl font-bold text-slate-100 mb-6">Payment Details</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status</span>
                  <span className={`px-2 py-1 text-xs rounded-lg border ${getStatusColor(order.payment_status)}`}>
                    {getStatusLabel(order.payment_status)}
                  </span>
                </div>

                {order.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid At</span>
                    <span className="text-slate-100">{formatDate(order.paid_at)}</span>
                  </div>
                )}

                {order.stripe_payment_intent_id && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Stripe Payment ID</p>
                    <p className="text-xs text-slate-500 font-mono break-all">
                      {order.stripe_payment_intent_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {order.notes && (
              <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <h2 className="text-xl font-bold text-slate-100 mb-4">Notes</h2>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}