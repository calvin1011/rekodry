import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryClient from '@/components/inventory/InventoryClient'

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch items from database
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items:', error)
  }

  return <InventoryClient initialItems={items || []} />
}