import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ShippingPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name, shipping_policy, processing_days, flat_shipping_rate, ships_from_city, ships_from_state')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  const defaultShippingPolicy = `
Processing Time

Orders are typically processed and shipped within ${store.processing_days || 2} business days (Monday-Friday, excluding holidays).

Shipping Methods & Costs

We currently offer standard shipping at a flat rate of $${store.flat_shipping_rate || 5.00} per order.

Shipping Locations

We ship from ${store.ships_from_city || 'our warehouse'}, ${store.ships_from_state || 'USA'} to addresses within the United States.

Delivery Time

- Standard Shipping: 3-7 business days after order processing
- Delivery times may vary during peak seasons or holidays
- Remote areas may experience longer delivery times

Order Tracking

Once your order ships, you'll receive:
- A shipping confirmation email
- A tracking number to monitor your package
- Updates on your order status

You can also track your order anytime by visiting your account page.

Shipping Restrictions

- We currently only ship within the United States
- P.O. Boxes are accepted
- We cannot ship to freight forwarding addresses

Lost or Damaged Packages

If your package is lost or damaged during shipping:
- Contact us immediately with your order number
- We'll work with the carrier to resolve the issue
- Replacements or refunds will be provided as appropriate

Address Changes

Please ensure your shipping address is correct before completing your order. If you need to update your address:
- Contact us immediately after placing your order
- Once the package has shipped, we cannot modify the address
- You may need to contact the carrier directly

International Shipping

We do not currently offer international shipping. We apologize for any inconvenience.

Holiday Shipping

During major holidays, please allow extra time for processing and delivery. We recommend ordering well in advance of any gift-giving occasions.
  `.trim()

  const policyContent = store.shipping_policy || defaultShippingPolicy

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Store
        </Link>

        <div className="glass-dark rounded-2xl p-8 border border-slate-800">
          <h1 className="text-3xl font-bold text-slate-100 mb-6">Shipping Policy</h1>
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
              {policyContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
