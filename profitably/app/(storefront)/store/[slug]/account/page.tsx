import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getSession, logout } from '../actions'
import AccountLoginForm from './AccountLoginForm'
import TrackOrderForm from './TrackOrderForm'

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab } = await searchParams
  const session = await getSession()

  const defaultTab = session?.type === 'customer' ? 'orders' : 'tracking'
  const requestedTab = tab === 'tracking' ? 'tracking' : 'orders'
  const activeTab = tab ? requestedTab : defaultTab

  const showOrders = activeTab === 'orders'
  const showTracking = activeTab === 'tracking'

  let orders: {
    id: string
    order_number: string
    total: number
    status: string | null
    payment_status: string | null
    fulfillment_status: string | null
    created_at: string
    paid_at: string | null
  }[] | null = null

  if (showOrders && session?.type === 'customer') {
    const supabase = await createClient()

    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        status,
        payment_status,
        fulfillment_status,
        created_at,
        paid_at,
        customers!inner(email)
      `)
      .eq('user_id', session.storeId)
      .eq('customers.email', session.email)
      .order('created_at', { ascending: false })

    orders = data
  }

  const totalOrders = orders?.length || 0
  const latestOrder = orders?.[0]
  const openOrders = orders?.filter((order) =>
    !['delivered', 'fulfilled', 'cancelled'].includes(order.fulfillment_status || 'pending')
  ).length || 0

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Account</h1>
            <p className="text-slate-400 text-sm mt-1">
              {session?.type === 'customer' ? session.email : 'Guest access'}
            </p>
          </div>
          {session?.type === 'customer' && (
            <form action={logout.bind(null, slug)}>
              <button className="text-sm text-slate-400 hover:text-red-400 transition-colors">
                Sign Out
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/store/${slug}/account?tab=orders`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              showOrders
                ? 'bg-profit-500/20 text-profit-300 border border-profit-500/30'
                : 'text-slate-300 hover:text-slate-100 border border-slate-800'
            }`}
          >
            Orders
          </Link>
          <Link
            href={`/store/${slug}/account?tab=tracking`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              showTracking
                ? 'bg-profit-500/20 text-profit-300 border border-profit-500/30'
                : 'text-slate-300 hover:text-slate-100 border border-slate-800'
            }`}
          >
            Tracking
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-dark rounded-xl border border-slate-800 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Total Orders</p>
            <p className="text-2xl font-bold text-slate-100 mt-2">
              {session?.type === 'customer' ? totalOrders : '—'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {session?.type === 'customer' ? 'All time purchases' : 'Sign in to see history'}
            </p>
          </div>

          <div className="glass-dark rounded-xl border border-slate-800 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Open Orders</p>
            <p className="text-2xl font-bold text-slate-100 mt-2">
              {session?.type === 'customer' ? openOrders : '—'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {session?.type === 'customer' ? 'Being processed or shipped' : 'Track as guest'}
            </p>
          </div>

          <div className="glass-dark rounded-xl border border-slate-800 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Latest Order</p>
            <p className="text-2xl font-bold text-slate-100 mt-2">
              {latestOrder ? formatCurrency(latestOrder.total) : '—'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {latestOrder
                ? `Status: ${latestOrder.fulfillment_status || 'pending'}`
                : session?.type === 'customer'
                ? 'No orders yet'
                : 'Sign in to see details'}
            </p>
          </div>
        </div>

        {showOrders && (
          <div className="space-y-4">
            {session?.type !== 'customer' && (
              <AccountLoginForm storeSlug={slug} compact />
            )}
            {session?.type === 'customer' && orders && orders.length > 0 ? (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/store/${slug}/orders/${order.id}`}
                  className="block glass-dark rounded-xl p-6 border border-slate-800
                           hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-slate-100 group-hover:text-profit-400 transition-colors">
                          {order.order_number}
                        </span>
                        <StatusBadge status={order.fulfillment_status || 'pending'} />
                      </div>
                      <p className="text-sm text-slate-400">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Total</p>
                        <p className="text-slate-200 font-medium">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div className="text-slate-500 group-hover:translate-x-1 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : session?.type === 'customer' ? (
              <div className="text-center py-16 glass-dark rounded-2xl border border-slate-800 border-dashed">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium mb-1">No orders yet</p>
                <p className="text-slate-500 text-sm mb-6">You haven't placed any orders with this store yet.</p>
                <Link
                  href={`/store/${slug}`}
                  className="px-6 py-2 bg-profit-600 hover:bg-profit-500 text-white rounded-lg transition-colors inline-block"
                >
                  Start Shopping
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {showTracking && <TrackOrderForm storeSlug={slug} />}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    shipped: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    delivered: 'bg-profit-500/10 text-profit-500 border-profit-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    fulfilled: 'bg-profit-500/10 text-profit-500 border-profit-500/20',
  }

  const activeStyle = styles[status as keyof typeof styles] || styles.pending

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeStyle} capitalize`}>
      {status}
    </span>
  )
}