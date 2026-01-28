import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error('Missing Supabase admin config', {
      hasUrl: !!url,
      hasServiceRoleKey: !!serviceRoleKey,
    })
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}
