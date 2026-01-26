import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuccessClient from '@/components/storefront/SuccessClient'

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

  return <SuccessClient storeSlug={slug} sessionId={session_id} />
}