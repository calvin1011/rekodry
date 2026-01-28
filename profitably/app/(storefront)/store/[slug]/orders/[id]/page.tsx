import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getSession } from '../../actions'

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const session = await getSession()

  if (!session) {
    redirect(`/store/${slug}/account?tab=tracking`)
  }

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          title,
          slug,
          product_images (image_url)
        )
      ),
      customer_addresses (
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
      ),
      customers (
        full_name,
        email
      )
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    notFound()
  }

  // Security: Verify access
  if (session.type === 'guest') {
    // Guest can only view the specific order from their session
    if (session.orderId !== order.id) {
      redirect(`/store/${slug}/account?tab=tracking&error=unauthorized`)
    }
  } else if (session.type === 'customer') {
    // Customer can only view their own orders
    if (order.customer_id !== session.customerId) {
      redirect(`/store/${slug}/account`)
    }
  }

  const backLink = session.type === 'customer'
    ? `/store/${slug}/account?tab=orders`
    : `/store/${slug}/account?tab=tracking`

  const backText = session.type === 'customer'
    ? 'Back to Orders'
    : 'Track Another Order'

  return (
    <div className="min-h-screen bg-gradient-dark py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href={backLink}
            className="text-profit-400 hover:text-profit-300 text-sm flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backText}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                Order {order.order_number}
              </h1>
              <p className="text-slate-400 text-sm">
                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${
                order.payment_status === 'paid' 
                  ? 'bg-profit-500/10 text-profit-500 border-profit-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {order.payment_status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${
                order.fulfillment_status === 'delivered' || order.fulfillment_status === 'fulfilled'
                  ? 'bg-profit-500/10 text-profit-500 border-profit-500/20'
                  : order.fulfillment_status === 'shipped'
                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {order.fulfillment_status || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Section */}
        {order.tracking_number && (
          <div className="glass-dark rounded-xl p-6 border border-slate-800 mb-8 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Tracking Information
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Tracking Number</p>
                <p className="text-slate-200 font-mono font-medium tracking-wide">{order.tracking_number}</p>
                {order.carrier && (
                  <p className="text-xs text-slate-500 mt-1 uppercase">{order.carrier}</p>
                )}
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-profit-600 hover:bg-profit-500 text-white text-sm font-medium rounded-lg transition-colors text-center"
                >
                  Track Package
                </a>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="glass-dark rounded-xl border border-slate-800 overflow-hidden shadow-lg mb-8">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-slate-100">Items</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="p-6 flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden border border-slate-700">
                  {item.products?.product_images?.[0]?.image_url ? (
                    <img
                      src={item.products.product_images[0].image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-200 font-medium truncate">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-200 font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(item.price)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-6 bg-slate-900/30 space-y-3 border-t border-slate-800">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-profit-500 text-sm">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-100 font-bold pt-4 border-t border-slate-800 text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.customer_addresses && (
          <div className="glass-dark rounded-xl p-6 border border-slate-800 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
              Shipping Address
            </h3>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <address className="not-italic text-slate-300 text-sm leading-relaxed">
                {order.customer_addresses.address_line1}<br />
                {order.customer_addresses.address_line2 && <>{order.customer_addresses.address_line2}<br/></>}
                {order.customer_addresses.city}, {order.customer_addresses.state} {order.customer_addresses.postal_code}<br />
                {order.customer_addresses.country}
              </address>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}