import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { storeSlug, productName, notes } = await request.json()

    const trimmed = typeof productName === 'string' ? productName.trim() : ''
    if (!trimmed) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    if (!storeSlug) {
      return NextResponse.json({ error: 'Store is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: store } = await supabase
      .from('store_settings')
      .select('user_id')
      .eq('store_slug', storeSlug)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('customer_product_requests')
      .insert({
        user_id: store.user_id,
        product_name: trimmed,
        notes: notes && typeof notes === 'string' ? notes.trim() || null : null,
      })

    if (error) {
      console.error('Error creating product request:', error)
      return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requests, error } = await supabase
      .from('customer_product_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching product requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, status } = await request.json()

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing requestId or status' }, { status: 400 })
    }

    if (!['reviewed', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('customer_product_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating product request:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
