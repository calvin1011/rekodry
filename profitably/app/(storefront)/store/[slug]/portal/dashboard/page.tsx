
import { createClient } from '@/lib/supabase/server'
import { getCustomerSession, logout } from '../actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function PortalDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getCustomerSession()

  if (!session) {
    redirect(`/store/${slug}/portal/login`)
  }

  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', session.customerId)
    .eq('user_id', session.storeId) // Filter for this store only
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/store/${slug}`} className="text-xl font-bold text-slate-100">
            Store Portal
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">{session.email}</span>
            <form action={logout.bind(null, slug)}>
              <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-100 mb-8">Order History</h1>

        <div className="space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/store/${slug}/portal/orders/${order.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-black/20 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
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
          ) : (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-300 font-medium mb-1">No orders yet</p>
              <p className="text-slate-500 text-sm mb-6">You haven't placed any orders with this store yet.</p>
              <Link
                href={`/store/${slug}`}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors inline-block"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    shipped: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    fulfilled: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  }

  const activeStyle = styles[status as keyof typeof styles] || styles.pending

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeStyle} capitalize`}>
      {status}
    </span>
  )
}