import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// fetch all sales for the authenticated user
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

    // fetch sales with item details
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('sale_date', { ascending: false })

    if (error) {
      console.error('Error fetching sales:', error)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// create a new sale
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
      item_id,
      platform,
      sale_price,
      sale_date,
      quantity_sold,
      platform_fees,
      shipping_cost,
      other_fees,
      notes,
    } = body

    if (!item_id || !platform || !sale_price || !sale_date || !quantity_sold) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof sale_price !== 'number' || sale_price < 0) {
      return NextResponse.json(
        { error: 'Sale price must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof quantity_sold !== 'number' || quantity_sold <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // check if item exists and belongs to user
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, quantity_on_hand, quantity_sold, purchase_price')
      .eq('id', item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // check if enough quantity available
    if (item.quantity_on_hand < quantity_sold) {
      return NextResponse.json(
        { error: `Only ${item.quantity_on_hand} units available` },
        { status: 400 }
      )
    }

    // calculate profits
    const purchasePrice = item.purchase_price
    const grossProfit = (sale_price * quantity_sold) - (purchasePrice * quantity_sold)
    const totalFees = (platform_fees || 0) + (shipping_cost || 0) + (other_fees || 0)
    const netProfit = grossProfit - totalFees
    const profitMargin = (sale_price * quantity_sold) > 0
      ? (netProfit / (sale_price * quantity_sold)) * 100
      : 0

    // create sale with calculated profit values
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: user.id,
        item_id,
        platform,
        sale_price,
        sale_date,
        quantity_sold,
        platform_fees: platform_fees || 0,
        shipping_cost: shipping_cost || 0,
        other_fees: other_fees || 0,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: profitMargin,
        notes: notes || null,
        is_synced_from_api: false,
      })
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category
        )
      `)
      .single()

    if (error) {
      console.error('Error creating sale:', error)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('items')
      .update({
        quantity_on_hand: item.quantity_on_hand - quantity_sold,
        quantity_sold: item.quantity_sold + quantity_sold,
        updated_at: new Date().toISOString()
      })
      .eq('id', item_id)

    if (updateError) {
      console.error('Error updating item quantities:', updateError)

      return NextResponse.json({
        error: 'Sale created but failed to update inventory'
      }, { status: 500 })
    }

    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// update a sale
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      platform,
      sale_price,
      sale_date,
      quantity_sold,
      platform_fees,
      shipping_cost,
      other_fees,
      notes,
    } = body

    if (!id) return NextResponse.json({ error: 'Sale ID required' }, { status: 400 })

    if (typeof sale_price !== 'number' || sale_price < 0) {
      return NextResponse.json(
        { error: 'Sale price must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof quantity_sold !== 'number' || quantity_sold <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // Get the old sale
    const { data: oldSale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (saleError || !oldSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', oldSale.item_id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Calculate available quantity
    // When editing, available = current on_hand + what was previously sold in this sale
    const availableQuantity = item.quantity_on_hand + oldSale.quantity_sold

    if (quantity_sold > availableQuantity) {
      return NextResponse.json({
        error: `Not enough stock. Only ${availableQuantity} units available (${item.quantity_on_hand} in stock + ${oldSale.quantity_sold} from this sale).`
      }, { status: 400 })
    }

    const purchasePrice = item.purchase_price
    const grossProfit = (sale_price * quantity_sold) - (purchasePrice * quantity_sold)
    const totalFees = (platform_fees || 0) + (shipping_cost || 0) + (other_fees || 0)
    const netProfit = grossProfit - totalFees
    const profitMargin = (sale_price * quantity_sold) > 0
      ? (netProfit / (sale_price * quantity_sold)) * 100
      : 0

    const { data: sale, error: updateError } = await supabase
      .from('sales')
      .update({
        platform,
        sale_price,
        sale_date,
        quantity_sold,
        platform_fees: platform_fees || 0,
        shipping_cost: shipping_cost || 0,
        other_fees: other_fees || 0,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: profitMargin,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        items (
          id,
          name,
          purchase_price,
          category
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating sale:', updateError)
      throw updateError
    }

    // Update inventory quantities
    // New on_hand = current + old_sold - new_sold
    // New sold = current - old_sold + new_sold
    const newQuantityOnHand = item.quantity_on_hand + oldSale.quantity_sold - quantity_sold
    const newQuantitySold = item.quantity_sold - oldSale.quantity_sold + quantity_sold

    const { error: inventoryError } = await supabase
      .from('items')
      .update({
        quantity_on_hand: newQuantityOnHand,
        quantity_sold: newQuantitySold,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)

    if (inventoryError) {
      console.error('Error updating inventory:', inventoryError)
      return NextResponse.json({
        error: 'Sale updated but failed to update inventory'
      }, { status: 500 })
    }

    return NextResponse.json({ sale })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get('id')

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 })
    }

    // Get the sale to restore inventory
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('item_id, quantity_sold')
      .eq('id', saleId)
      .eq('user_id', user.id)
      .single()

    if (saleError || !sale) {
      console.error('Sale not found:', saleError)
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Try to get the item (including archived items)
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('quantity_purchased, quantity_on_hand, quantity_sold, is_archived')
      .eq('id', sale.item_id)
      .single()

    // If item exists and is not archived, update its quantities
    if (!itemError && item && !item.is_archived) {
      console.log('Item found, updating quantities')

      // Calculate new quantities with constraint validation
      const newOnHand = item.quantity_on_hand + sale.quantity_sold
      let newSold = Math.max(0, item.quantity_sold - sale.quantity_sold)

      // Ensure constraint: on_hand + sold = purchased
      if (newOnHand + newSold !== item.quantity_purchased) {
        newSold = item.quantity_purchased - newOnHand
        if (newSold < 0) {
          newSold = 0
        }
      }

      console.log('Quantities:', {
        purchased: item.quantity_purchased,
        current: { onHand: item.quantity_on_hand, sold: item.quantity_sold },
        new: { onHand: newOnHand, sold: newSold },
        valid: (newOnHand + newSold) === item.quantity_purchased
      })

      // Update item quantities
      const { error: updateError } = await supabase
        .from('items')
        .update({
          quantity_on_hand: newOnHand,
          quantity_sold: newSold,
        })
        .eq('id', sale.item_id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({
          error: 'Failed to update inventory',
          details: updateError.message
        }, { status: 500 })
      }

      console.log('Item quantities updated successfully')
    } else {
      // Item doesn't exist or is archived
      console.log('Item not found or archived, skipping inventory update')
    }

    // Delete the sale (whether item exists or not)
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete sale',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('Sale deleted successfully')
    return NextResponse.json({
      message: 'Sale deleted successfully',
      note: item ? undefined : 'Item was already deleted, only sale record was removed'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}