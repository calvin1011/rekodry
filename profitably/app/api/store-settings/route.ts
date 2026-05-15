import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching store settings:', error)
      return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      store_name,
      store_slug,
      store_description,
      logo_url,
      banner_url,
      business_name,
      business_email,
      business_phone,
      flat_shipping_rate,
      free_shipping_threshold,
      ships_from_zip,
      ships_from_city,
      ships_from_state,
      processing_days,
      return_policy,
      shipping_policy,
      terms_of_service,
      is_active,
      seo_title,
      seo_description,
    } = body

    if (!store_name || !store_slug) {
      return NextResponse.json(
        { error: 'Store name and slug are required' },
        { status: 400 }
      )
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(store_slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      )
    }

    const { data: existingStore, error: checkError } = await supabase
      .from('store_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing store:', checkError)
      return NextResponse.json({ error: 'Failed to check store' }, { status: 500 })
    }

    if (existingStore) {
      return NextResponse.json(
        { error: 'Store settings already exist. Use PATCH to update.' },
        { status: 400 }
      )
    }

    const { data: slugCheck } = await supabase
      .from('store_settings')
      .select('id')
      .eq('store_slug', store_slug)
      .neq('user_id', user.id)
      .single()

    if (slugCheck) {
      return NextResponse.json(
        { error: 'This store slug is already taken' },
        { status: 409 }
      )
    }

    const { data: settings, error } = await supabase
      .from('store_settings')
      .insert({
        user_id: user.id,
        store_name,
        store_slug,
        store_description: store_description || null,
        logo_url: logo_url || null,
        banner_url: banner_url || null,
        business_name: business_name || null,
        business_email: business_email || null,
        business_phone: business_phone || null,
        flat_shipping_rate: flat_shipping_rate || 5.0,
        free_shipping_threshold: free_shipping_threshold || null,
        ships_from_zip: ships_from_zip || null,
        ships_from_city: ships_from_city || null,
        ships_from_state: ships_from_state || null,
        processing_days: processing_days || 2,
        return_policy: return_policy || null,
        shipping_policy: shipping_policy || null,
        terms_of_service: terms_of_service || null,
        is_active: is_active || false,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating store settings:', error)
      return NextResponse.json({ error: 'Failed to create store settings' }, { status: 500 })
    }

    return NextResponse.json({ settings }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const allowedUpdates: any = {}
    const validFields = [
      'store_name',
      'store_slug',
      'store_description',
      'logo_url',
      'banner_url',
      'business_name',
      'business_email',
      'business_phone',
      'flat_shipping_rate',
      'free_shipping_threshold',
      'ships_from_zip',
      'ships_from_city',
      'ships_from_state',
      'processing_days',
      'return_policy',
      'shipping_policy',
      'terms_of_service',
      'is_active',
      'seo_title',
      'seo_description',
    ]

    validFields.forEach((field) => {
      if (body[field] !== undefined) {
        allowedUpdates[field] = body[field]
      }
    })

    if (allowedUpdates.store_slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(allowedUpdates.store_slug)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
          { status: 400 }
        )
      }

      const { data: slugCheck } = await supabase
        .from('store_settings')
        .select('id')
        .eq('store_slug', allowedUpdates.store_slug)
        .neq('user_id', user.id)
        .single()

      if (slugCheck) {
        return NextResponse.json(
          { error: 'This store slug is already taken' },
          { status: 409 }
        )
      }
    }

    const { data: settings, error } = await supabase
      .from('store_settings')
      .update(allowedUpdates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating store settings:', error)
      return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}