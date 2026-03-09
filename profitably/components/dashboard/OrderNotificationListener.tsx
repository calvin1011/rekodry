'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

/**
 * Listens for new orders via Supabase Realtime and shows a toast.
 * Only runs when the user is authenticated (dashboard).
 *
 * Ensure the `orders` table is in the Supabase Realtime publication:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
 */
export default function OrderNotificationListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`orders:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string
              order_number: string
              total?: number
            }
            const orderId = row?.id
            const orderNumber = row?.order_number ?? 'Unknown'
            const total = row?.total

            try {
              const { data: order } = await supabase
                .from('orders')
                .select(
                  `
                  order_number,
                  total,
                  customers ( full_name ),
                  order_items ( title, quantity )
                `
                )
                .eq('id', orderId)
                .single()

              const customerName =
                (order?.customers as { full_name?: string } | null)?.full_name ??
                'A customer'
              const items = (order?.order_items as { title: string; quantity: number }[] | null) ?? []
              const itemSummary =
                items.length === 0
                  ? 'items'
                  : items.length === 1
                    ? `${items[0].title}${items[0].quantity > 1 ? ` (×${items[0].quantity})` : ''}`
                    : `${items[0].title} +${items.length - 1} more`

              const totalFormatted =
                total != null ? formatCurrency(total) : order?.total != null ? formatCurrency(order.total as number) : ''

              toast.success('New Order!', {
                description: `${customerName} ordered ${itemSummary}${totalFormatted ? ` · ${totalFormatted}` : ''}`,
                duration: 5000,
                action: orderId
                  ? {
                      label: 'View',
                      onClick: () => router.push(`/orders/${orderId}`),
                    }
                  : undefined,
              })
            } catch {
              toast.success('New Order!', {
                description: `Order ${orderNumber} just came in.`,
                duration: 5000,
                action: orderId
                  ? {
                      label: 'View',
                      onClick: () => router.push(`/orders/${orderId}`),
                    }
                  : undefined,
              })
            }
          }
        )
        .subscribe()

      return channel
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router])

  return null
}
