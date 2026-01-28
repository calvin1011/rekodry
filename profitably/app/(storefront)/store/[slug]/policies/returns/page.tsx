import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ReturnPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name, return_policy')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  const defaultReturnPolicy = `
30-Day Money Back Guarantee

We want you to be completely satisfied with your purchase. If you're not happy with your order, you can return it within 30 days of delivery for a full refund.

Return Conditions

- Items must be in their original condition and packaging
- Items must be unused and undamaged
- All original tags and labels must be attached
- Proof of purchase (order number) is required

How to Return

1. Contact us at ${store.store_name} with your order number
2. We'll provide you with return shipping instructions
3. Ship the item back using a trackable shipping method
4. Once we receive and inspect the return, we'll process your refund

Refund Processing

- Refunds will be issued to the original payment method
- Please allow 5-10 business days for the refund to appear on your statement
- Original shipping costs are non-refundable
- Return shipping costs are the responsibility of the customer unless the item was defective or we made an error

Non-Returnable Items

- Digital products
- Items marked as final sale
- Gift cards

Exchanges

We don't offer direct exchanges at this time. If you need a different item, please return the original item for a refund and place a new order.

Damaged or Defective Items

If you receive a damaged or defective item:
- Contact us immediately with photos of the damage
- We'll arrange for a replacement or full refund at no cost to you
- Return shipping for defective items will be covered by us
  `.trim()

  const policyContent = store.return_policy || defaultReturnPolicy

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
          <h1 className="text-3xl font-bold text-slate-100 mb-6">Return Policy</h1>
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
