'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StoreVisitWidgetProps {
  storeSlug: string
  todayCount: number
  totalCount: number
}

function formatToday(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function StoreVisitWidget({
  storeSlug,
  todayCount: initialToday,
  totalCount: initialTotal,
}: StoreVisitWidgetProps) {
  const [todayCount, setTodayCount] = useState(initialToday)
  const [totalCount, setTotalCount] = useState(initialTotal)

  useEffect(() => {
    setTodayCount(initialToday)
    setTotalCount(initialTotal)
  }, [initialToday, initialTotal])

  useEffect(() => {
    if (!storeSlug) return
    const supabase = createClient()
    const today = formatToday()
    const channel = supabase
      .channel(`store_visits:${storeSlug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'store_visits',
          filter: `store_slug=eq.${storeSlug}`,
        },
        (payload) => {
          const row = payload.new as { visited_date?: string }
          const visitedDate = row?.visited_date
          setTotalCount((c) => c + 1)
          if (visitedDate === today) {
            setTodayCount((c) => c + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeSlug])

  return (
    <div className="glass-dark rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-smooth animate-slide-up">
      <h3 className="text-xl font-bold text-slate-100 mb-4">Store visits</h3>
      <div className="space-y-3">
        <div>
          <p className="text-slate-400 text-sm font-medium">Today&apos;s visits</p>
          <p className="text-2xl font-bold text-slate-100">{todayCount}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium">Overall visits</p>
          <p className="text-2xl font-bold text-slate-100">{totalCount}</p>
        </div>
      </div>
    </div>
  )
}
