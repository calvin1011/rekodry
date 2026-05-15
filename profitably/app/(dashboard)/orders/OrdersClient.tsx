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
  notes: string | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  customers: Customer
  customer_addresses: CustomerAddress | null
  order_items: OrderItem[]
}

interface OrdersClientProps {
  initialOrders: Order[]
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterFulfillment, setFilterFulfillment] = useState<string>('all')

  const filteredOrders = initialOrders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers.full_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' || order.payment_status === filterStatus

    const matchesFulfillment =
      filterFulfillment === 'all' ||
      (filterFulfillment === 'unfulfilled' && !order.fulfillment_status) ||
      order.fulfillment_status === filterFulfillment

    return matchesSearch && matchesStatus && matchesFulfillment
  })

  const totalOrders = initialOrders.length
  const totalRevenue = initialOrders.reduce((sum, order) => sum + order.total, 0)
  const paidOrders = initialOrders.filter(o => o.payment_status === 'paid').length
  const unfulfilledOrders = initialOrders.filter(o => !o.fulfillment_status || o.fulfillment_status === 'pending').length

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

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Orders</span>
          </h1>
          <p className="text-slate-400">Manage customer orders and fulfillment</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 animate-slide-up hover:border-slate-700/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-slate-100">{totalOrders}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 animate-slide-up hover:border-profit-500/30 transition-colors" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-profit-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-profit-400">{formatCurrency(totalRevenue)}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 animate-slide-up hover:border-slate-700/50 transition-colors" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Paid Orders</p>
            <p className="text-3xl font-bold text-slate-100">{paidOrders}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 animate-slide-up hover:border-amber-500/30 transition-colors" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {unfulfilledOrders > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                  Action needed
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Unfulfilled</p>
            <p className="text-3xl font-bold text-amber-400">{unfulfilledOrders}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-8 animate-slide-down" style={{ animationDelay: '0.4s' }}>
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, customers..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-slate-100 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                       transition-smooth"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                     text-slate-100
                     focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                     transition-smooth"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refund_pending">Refund pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={filterFulfillment}
            onChange={(e) => setFilterFulfillment(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                     text-slate-100
                     focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                     transition-smooth"
          >
            <option value="all">All Fulfillment</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-slate-400">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Orders from your storefront will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing <span className="font-medium text-slate-200">{filteredOrders.length}</span> of {initialOrders.length} orders
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/30">
                    <th className="text-left py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Order</th>
                    <th className="text-left py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Payment</th>
                    <th className="text-left py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Fulfillment</th>
                    <th className="text-right py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider">Total</th>
                    <th className="text-right py-3.5 px-6 text-slate-400 font-medium text-xs uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="border-t border-slate-800/30 hover:bg-slate-800/20 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-profit-500/20 group-hover:text-profit-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{order.order_number}</p>
                            <p className="text-xs text-slate-500">{order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{order.customers.full_name}</p>
                          <p className="text-xs text-slate-500">{order.customers.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-300">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(order.payment_status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.payment_status === 'paid' ? 'bg-profit-400' :
                            order.payment_status === 'pending' ? 'bg-amber-400' :
                            order.payment_status === 'cancelled' ? 'bg-red-400' :
                            order.payment_status === 'refunded' ? 'bg-purple-400' : 'bg-slate-400'
                          }`} />
                          {getStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getFulfillmentColor(order.fulfillment_status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.fulfillment_status === 'fulfilled' ? 'bg-profit-400' :
                            order.fulfillment_status === 'shipped' ? 'bg-blue-400' :
                            order.fulfillment_status === 'delivered' ? 'bg-green-400' :
                            order.fulfillment_status === 'pending' ? 'bg-amber-400' : 'bg-slate-400'
                          }`} />
                          {getFulfillmentLabel(order.fulfillment_status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-semibold text-slate-100">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-profit-400 hover:bg-profit-500/10 rounded-lg transition-all"
                        >
                          View
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}