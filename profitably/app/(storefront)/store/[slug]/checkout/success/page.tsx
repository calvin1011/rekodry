import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CheckoutSuccessPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { slug } = await params
  const { session_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/store/${slug}/checkout/success`)
  }

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) {
    redirect(`/store/${slug}`)
  }

  if (!session_id) {
    redirect(`/store/${slug}`)
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-dark rounded-2xl p-8 text-center animate-slide-up">
        <div className="w-20 h-20 bg-profit-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-3">
          Order Successful!
        </h1>
        <p className="text-slate-400 mb-6">
          Thank you for your order. You'll receive an email confirmation shortly with your order details.
        </p>

        <div className="space-y-3">
          <Link
            href={`/store/${slug}`}
            className="block w-full px-6 py-3 rounded-xl font-semibold
                     bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/50
                     hover:shadow-glow-profit-lg hover:scale-[1.02]
                     active:scale-[0.98]
                     transition-smooth"
          >
            Continue Shopping
          </Link>

          <p className="text-xs text-slate-500 mt-4">
            Order ID: {session_id.substring(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  )
}