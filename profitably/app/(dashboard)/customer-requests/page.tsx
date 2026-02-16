import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerRequestsClient from './CustomerRequestsClient'

export default async function CustomerRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('customer_product_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <CustomerRequestsClient initialRequests={requests || []} />
}
