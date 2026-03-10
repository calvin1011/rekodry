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
  shipping_address_id: string | null
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
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [addressLine1, setAddressLine1] = useState(order.customer_addresses?.address_line1 ?? '')
  const [addressLine2, setAddressLine2] = useState(order.customer_addresses?.address_line2 ?? '')
  const [addressCity, setAddressCity] = useState(order.customer_addresses?.city ?? '')
  const [addressState, setAddressState] = useState(order.customer_addresses?.state ?? '')
  const [addressPostalCode, setAddressPostalCode] = useState(order.customer_addresses?.postal_code ?? '')
  const [addressCountry, setAddressCountry] = useState(order.customer_addresses?.country ?? 'US')
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [customerFullName, setCustomerFullName] = useState(order.customers?.full_name ?? '')
  const [customerPhone, setCustomerPhone] = useState(order.customers?.phone ?? '')
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [shippingRates, setShippingRates] = useState<Array<{ object_id: string; amount: string; currency: string; provider: string; servicelevel: { name: string }; estimated_days: number | null; tracking_url?: string | null }>>([])
  const [shipmentId, setShipmentId] = useState<string | null>(null)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState(false)
  const [shippingError, setShippingError] = useState<string | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-profit-500/20 text-profit-400 border-profit-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'refund_pending':
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
    if (status === 'refund_pending') return 'Refund pending'
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          fulfillment_status: newStatus?.toLowerCase?.() || newStatus,
        }),
      })

      const data = await response.json().catch(() => ({}))
      const message = (data && typeof data.error === 'string' ? data.error : null) || (response.status === 401 ? 'Please sign in again.' : response.status === 404 ? 'Order not found.' : 'Failed to update status.')

      if (!response.ok) {
        throw new Error(message)
      }

      setIsEditingStatus(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleGetShippingRates = async () => {
    setLoadingRates(true)
    setShippingError(null)
    setShippingRates([])
    setShipmentId(null)
    setSelectedRateId(null)
    try {
      const res = await fetch('/api/orders/shipping/rates', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setShippingError(data?.error || 'Failed to get rates')
        return
      }
      setShippingRates(data?.rates || [])
      if (data?.shipment_id) setShipmentId(data.shipment_id)
      if (data?.rates?.length) setSelectedRateId(data.rates[0].object_id)
    } catch (e) {
      setShippingError('Failed to load shipping rates')
    } finally {
      setLoadingRates(false)
    }
  }

  const handlePurchaseLabel = async () => {
    if (!selectedRateId || !shipmentId) return
    setLoadingLabel(true)
    setShippingError(null)
    try {
      const res = await fetch('/api/orders/shipping/label', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          rate_object_id: selectedRateId,
          shipment_id: shipmentId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setShippingError(data?.error || 'Failed to purchase label')
        return
      }
      if (data?.label_url) {
        window.open(data.label_url, '_blank', 'noopener,noreferrer')
      }
      router.refresh()
    } catch (e) {
      setShippingError('Failed to purchase label')
    } finally {
      setLoadingLabel(false)
    }
  }

  const handleUpdateTracking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/orders/tracking', {
        method: 'PATCH',
        credentials: 'include',
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

      const data = await response.json().catch(() => ({}))
      const message = (data && typeof data.error === 'string' ? data.error : null) || (response.status === 401 ? 'Please sign in again.' : response.status === 404 ? 'Order not found.' : 'Failed to update tracking.')

      if (!response.ok) {
        throw new Error(message)
      }

      setIsEditingTracking(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracking')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async () => {
    setCustomerLoading(true)
    setCustomerError(null)
    try {
      const response = await fetch('/api/orders/customer', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          customer_id: order.customers.id,
          full_name: customerFullName.trim() || null,
          phone: customerPhone.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      const message = (data && typeof data.error === 'string' ? data.error : null) || (response.status === 401 ? 'Please sign in again.' : response.status === 404 ? 'Order not found.' : 'Failed to update customer.')
      if (!response.ok) throw new Error(message)
      setIsEditingCustomer(false)
      router.refresh()
    } catch (err) {
      setCustomerError(err instanceof Error ? err.message : 'Failed to update customer')
    } finally {
      setCustomerLoading(false)
    }
  }

  const handleUpdateAddress = async () => {
    if (!order.customer_addresses?.id) return
    setAddressLoading(true)
    setAddressError(null)

    try {
      const response = await fetch('/api/orders/address', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          address_id: order.customer_addresses.id,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: addressCity.trim(),
          state: addressState.trim(),
          postal_code: addressPostalCode.trim(),
          country: addressCountry.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      const message = (data && typeof data.error === 'string' ? data.error : null) || (response.status === 401 ? 'Please sign in again.' : response.status === 404 ? 'Order not found.' : 'Failed to update address.')

      if (!response.ok) {
        throw new Error(message)
      }

      setIsEditingAddress(false)
      router.refresh()
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to update address')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleIssueRefund = async () => {
    setRefundLoading(true)
    setRefundError(null)
    try {
      const res = await fetch('/api/orders/refund', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRefundError(data?.error || 'Failed to create refund')
        return
      }
      router.refresh()
    } catch (e) {
      setRefundError('Failed to create refund')
    } finally {
      setRefundLoading(false)
    }
  }

  const handleResolveRefund = async (resolution: 'damaged' | 'restock') => {
    setRefundLoading(true)
    setRefundError(null)
    try {
      const res = await fetch('/api/orders/refund/resolve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, resolution }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRefundError(data?.error || 'Failed to resolve refund')
        return
      }
      router.refresh()
    } catch (e) {
      setRefundError('Failed to resolve refund')
    } finally {
      setRefundLoading(false)
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

        {(error || refundError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
            {refundError || error}
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

            {!order.tracking_number && (
              <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.18s' }}>
                <h2 className="text-xl font-bold text-slate-100 mb-2">Create Shipping Label</h2>
                <p className="text-slate-400 text-sm mb-4">
                  Get rates from USPS, UPS, FedEx, and more. Purchase a label and we&apos;ll update tracking and notify the customer.
                </p>
                {shippingError && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
                    {shippingError}
                  </div>
                )}
                {shippingRates.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleGetShippingRates}
                    disabled={loadingRates}
                    className="px-4 py-2 rounded-xl font-semibold bg-profit-600 text-white hover:bg-profit-500 disabled:opacity-50 transition-colors"
                  >
                    {loadingRates ? 'Loading rates…' : 'Get shipping rates'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm">Select a rate and purchase to print the label:</p>
                    <ul className="space-y-2">
                      {shippingRates.map((rate) => (
                        <li key={rate.object_id}>
                          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:bg-slate-800/50 cursor-pointer">
                            <input
                              type="radio"
                              name="shipping-rate"
                              checked={selectedRateId === rate.object_id}
                              onChange={() => setSelectedRateId(rate.object_id)}
                              className="text-profit-500"
                            />
                            <span className="text-slate-200 font-medium">{rate.provider}</span>
                            <span className="text-slate-400 text-sm">{rate.servicelevel?.name}</span>
                            <span className="text-profit-400 font-semibold ml-auto">
                              ${rate.amount} {rate.currency}
                            </span>
                            {rate.estimated_days != null && (
                              <span className="text-slate-500 text-xs">~{rate.estimated_days} days</span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { setShippingRates([]); setShipmentId(null); setSelectedRateId(null); setShippingError(null); }}
                        className="px-4 py-2 rounded-xl font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handlePurchaseLabel}
                        disabled={loadingLabel || !selectedRateId || !shipmentId}
                        className="px-4 py-2 rounded-xl font-semibold bg-gradient-profit text-white shadow-lg shadow-profit-500/30 hover:shadow-glow-profit disabled:opacity-50"
                      >
                        {loadingLabel ? 'Purchasing…' : 'Purchase label & print'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100">Customer</h2>
                {!isEditingCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCustomer(true)
                      setCustomerFullName(order.customers?.full_name ?? '')
                      setCustomerPhone(order.customers?.phone ?? '')
                      setCustomerError(null)
                    }}
                    className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                  >
                    Edit Name / Phone
                  </button>
                )}
              </div>

              {isEditingCustomer ? (
                <div className="space-y-4">
                  {customerError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {customerError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customerFullName}
                      onChange={(e) => setCustomerFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Email cannot be changed here.</p>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className="flex-1 px-4 py-2 rounded-xl font-medium bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateCustomer}
                      disabled={customerLoading}
                      className="flex-1 px-4 py-2 rounded-xl font-semibold bg-gradient-profit text-white hover:shadow-glow-profit-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                    >
                      {customerLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Name</p>
                    <p className="text-slate-100 font-medium">{order.customers.full_name || '—'}</p>
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

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Phone</p>
                    {order.customers.phone ? (
                      <a
                        href={`tel:${order.customers.phone}`}
                        className="text-profit-400 hover:text-profit-300 transition-colors"
                      >
                        {order.customers.phone}
                      </a>
                    ) : (
                      <p className="text-slate-500">—</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {order.customer_addresses && (
              <div className="glass-dark rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-100">Shipping Address</h2>
                  {!isEditingAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAddress(true)
                        setAddressLine1(order.customer_addresses?.address_line1 ?? '')
                        setAddressLine2(order.customer_addresses?.address_line2 ?? '')
                        setAddressCity(order.customer_addresses?.city ?? '')
                        setAddressState(order.customer_addresses?.state ?? '')
                        setAddressPostalCode(order.customer_addresses?.postal_code ?? '')
                        setAddressCountry(order.customer_addresses?.country ?? 'US')
                        setAddressError(null)
                      }}
                      className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                    >
                      Edit Address
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className="space-y-4">
                    {addressError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {addressError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">City</label>
                        <input
                          type="text"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">State</label>
                        <input
                          type="text"
                          value={addressState}
                          onChange={(e) => setAddressState(e.target.value)}
                          maxLength={2}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={addressPostalCode}
                          onChange={(e) => setAddressPostalCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Country</label>
                        <input
                          type="text"
                          value={addressCountry}
                          onChange={(e) => setAddressCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 px-4 py-2 rounded-xl font-medium bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateAddress}
                        disabled={addressLoading || !addressLine1.trim() || !addressCity.trim() || !addressState.trim() || !addressPostalCode.trim()}
                        className="flex-1 px-4 py-2 rounded-xl font-semibold bg-gradient-profit text-white hover:shadow-glow-profit-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                      >
                        {addressLoading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
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

                {order.payment_status === 'paid' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleIssueRefund}
                      disabled={refundLoading}
                      className="px-4 py-2 rounded-xl font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
                    >
                      {refundLoading ? 'Processing…' : 'Issue refund'}
                    </button>
                  </div>
                )}

                {order.payment_status === 'refund_pending' && (
                  <div className="pt-2 space-y-2">
                    <p className="text-slate-400 text-sm">Refund pending – resolve after reviewing the item:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolveRefund('damaged')}
                        disabled={refundLoading}
                        className="px-4 py-2 rounded-xl font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                      >
                        Mark damaged (do not restock)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveRefund('restock')}
                        disabled={refundLoading}
                        className="px-4 py-2 rounded-xl font-medium bg-profit-600 text-white hover:bg-profit-500 disabled:opacity-50 transition-colors"
                      >
                        Mark good (restock inventory)
                      </button>
                    </div>
                  </div>
                )}

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