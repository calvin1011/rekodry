import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StoreSettingsClient from './StoreSettingsClient'

export default async function StoreSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: settings, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching store settings:', error)
  }

  return <StoreSettingsClient initialSettings={settings || null} />
}