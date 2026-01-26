import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckoutClient from '@/components/storefront/CheckoutClient'

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/store/${slug}/checkout`)
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

  return <CheckoutClient store={store} storeSlug={slug} />
}