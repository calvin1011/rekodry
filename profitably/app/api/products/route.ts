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

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        items (
          id,
          name,
          quantity_on_hand,
          purchase_price,
          category
        ),
        product_images (
          id,
          image_url,
          alt_text,
          position
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products })
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
      item_id,
      title,
      description,
      price,
      compare_at_price,
      weight_oz,
      requires_shipping,
      is_published,
      seo_title,
      seo_description,
      images,
    } = body

    if (!item_id || !title || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, title, price' },
        { status: 400 }
      )
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, name, sku')
      .eq('id', item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found or does not belong to user' },
        { status: 404 }
      )
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        item_id,
        title,
        description: description || null,
        slug,
        price,
        compare_at_price: compare_at_price || null,
        sku: item.sku,
        weight_oz: weight_oz || 0,
        requires_shipping: requires_shipping !== false,
        is_published: is_published || false,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    if (images && Array.isArray(images) && images.length > 0) {
      const imageInserts = images.map((img: { url: string; alt?: string }, index: number) => ({
        product_id: product.id,
        image_url: img.url,
        alt_text: img.alt || title,
        position: index,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Error inserting product images:', imagesError)
      }
    }

    return NextResponse.json({ product }, { status: 201 })
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
    const { id, images, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const allowedUpdates: any = {}
    const validFields = [
      'title',
      'description',
      'price',
      'compare_at_price',
      'weight_oz',
      'requires_shipping',
      'is_published',
      'seo_title',
      'seo_description',
    ]

    validFields.forEach((field) => {
      if (updates[field] !== undefined) {
        allowedUpdates[field] = updates[field]
      }
    })

    if (allowedUpdates.title) {
      allowedUpdates.slug = allowedUpdates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    if (images && Array.isArray(images)) {
      await supabase.from('product_images').delete().eq('product_id', id)

      if (images.length > 0) {
        const imageInserts = images.map((img: { url: string; alt?: string }, index: number) => ({
          product_id: id,
          image_url: img.url,
          alt_text: img.alt || product.title,
          position: index,
        }))

        await supabase.from('product_images').insert(imageInserts)
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Unexpected error:', error)
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
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const { data: orders, error: ordersError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (ordersError) {
      console.error('Error checking orders:', ordersError)
      return NextResponse.json({ error: 'Failed to check product orders' }, { status: 500 })
    }

    if (orders && orders.length > 0) {
      const { error: unpublishError } = await supabase
        .from('products')
        .update({ is_published: false })
        .eq('id', productId)
        .eq('user_id', user.id)

      if (unpublishError) {
        console.error('Error unpublishing product:', unpublishError)
        return NextResponse.json({ error: 'Failed to unpublish product' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Product has orders and was unpublished instead of deleted'
      })
    }

    // Delete product images first (foreign key constraint)
    const { error: imagesDeleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    if (imagesDeleteError) {
      console.error('Error deleting product images:', imagesDeleteError)
      return NextResponse.json({ error: 'Failed to delete product images' }, { status: 500 })
    }

    // Now delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}