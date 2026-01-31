import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CheckoutClient from '@/components/storefront/CheckoutClient'

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) {
    redirect(`/store/${slug}`)
  }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('customer_session')?.value || null
  const customerId = cookieStore.get('customer_id')?.value || null
  let prefillEmail: string | null = null

  if (sessionToken) {
    try {
      const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
      if (payload?.exp && Date.now() < payload.exp && payload?.type === 'customer' && payload?.email) {
        prefillEmail = payload.email
      }
    } catch {
      prefillEmail = null
    }
  }

  if (!prefillEmail && customerId) {
    const adminClient = createAdminClient()
    const { data: customer, error: customerError } = await adminClient
      .from('customers')
      .select('email')
      .eq('id', customerId)
      .single()
    if (!customerError && customer?.email) {
      prefillEmail = customer.email
    }
  }

  return <CheckoutClient store={store} storeSlug={slug} prefillEmail={prefillEmail} />
}