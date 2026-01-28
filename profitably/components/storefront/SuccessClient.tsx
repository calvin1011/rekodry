'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import Link from 'next/link'

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  created_at: string
  order_items: OrderItem[]
  customer_addresses: {
    address_line1: string
    address_line2: string | null
    city: string
    state: string
    postal_code: string
  } | null
}

interface SuccessClientProps {
  storeSlug: string
  storeName: string
  sessionId: string
  order: Order | null
}

export default function SuccessClient({ storeSlug, storeName, sessionId, order }: SuccessClientProps) {
  const { clearCart } = useCart()
  const [showToast, setShowToast] = useState(true)

  useEffect(() => {
    clearCart()
    
    // Hide toast after 5 seconds
    const timer = setTimeout(() => setShowToast(false), 5000)
    return () => clearTimeout(timer)
  }, [clearCart])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-profit-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-profit-500/30 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Order placed successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-profit-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            Thank you for your order!
          </h1>
          <p className="text-slate-400">
            A confirmation email has been sent with your order details.
          </p>
        </div>

        {/* Order Summary */}
        {order ? (
          <div className="glass-dark rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
              <div>
                <p className="text-sm text-slate-400">Order Number</p>
                <p className="text-lg font-bold text-slate-100">{order.order_number}</p>
              </div>
              <span className="px-3 py-1 bg-profit-500/10 text-profit-400 rounded-full text-sm font-medium capitalize">
                {order.status}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Items Ordered</h3>
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium">{item.title}</p>
                    <p className="text-sm text-slate-400">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-slate-200 font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span>{order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-100 pt-2">
                <span>Total</span>
                <span className="text-profit-400">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {order.customer_addresses && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Shipping To</h3>
                <p className="text-slate-400">
                  {order.customer_addresses.address_line1}
                  {order.customer_addresses.address_line2 && <>, {order.customer_addresses.address_line2}</>}
                  <br />
                  {order.customer_addresses.city}, {order.customer_addresses.state} {order.customer_addresses.postal_code}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-dark rounded-2xl p-6 mb-6 animate-slide-up text-center" style={{ animationDelay: '0.1s' }}>
            <p className="text-slate-400">
              Your order is being processed. Check your email for confirmation details.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Session: {sessionId.substring(0, 30)}...
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {order && (
            <Link
              href={`/store/${storeSlug}/orders/${order.id}`}
              className="block w-full px-6 py-3 rounded-xl font-semibold text-center
                       bg-slate-700 hover:bg-slate-600 text-white
                       transition-smooth"
            >
              View Order Details
            </Link>
          )}
          <a
            href={`/store/${storeSlug}`}
            className="block w-full px-6 py-3 rounded-xl font-semibold text-center
                     bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/50
                     hover:shadow-glow-profit-lg hover:scale-[1.02]
                     active:scale-[0.98]
                     transition-smooth"
          >
            Continue Shopping
          </a>
          <Link
            href={`/store/${storeSlug}/account?tab=orders`}
            className="block w-full px-6 py-3 rounded-xl font-semibold text-center
                     border border-slate-700 text-slate-300 hover:bg-slate-800
                     transition-smooth"
          >
            View All Orders
          </Link>
        </div>

        {/* Store Name */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Thank you for shopping at {storeName}
        </p>
      </div>
    </div>
  )
}