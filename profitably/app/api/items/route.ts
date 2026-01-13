import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// fetch all items for the authenticated user
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

    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new item
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
      name,
      description,
      sku,
      category,
      purchase_price,
      purchase_date,
      purchase_location,
      quantity_purchased,
      image_url,
      notes,
    } = body

    if (!name || !purchase_price || !purchase_date || !purchase_location || !quantity_purchased) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof purchase_price !== 'number' || purchase_price < 0) {
      return NextResponse.json(
        { error: 'Purchase price must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof quantity_purchased !== 'number' || quantity_purchased <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        sku: sku || null,
        category: category || null,
        purchase_price,
        purchase_date,
        purchase_location,
        quantity_purchased,
        quantity_on_hand: quantity_purchased,
        quantity_sold: 0,
        image_url: image_url || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error)
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// delete an item
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id')
      .eq('item_id', itemId)
      .limit(1)

    if (salesError) {
      console.error('Error checking sales:', salesError)
      return NextResponse.json({ error: 'Failed to check item sales' }, { status: 500 })
    }

    if (sales && sales.length > 0) {
      // has sales history - archive instead
      const { error: archiveError } = await supabase
        .from('items')
        .update({ is_archived: true })
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (archiveError) {
        console.error('Error archiving item:', archiveError)
        return NextResponse.json({ error: 'Failed to archive item' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Item archived successfully' })
    } else {
      // no sales history - safe to delete
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting item:', deleteError)
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Item deleted successfully' })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}