'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'

type ProductRequest = {
  id: string
  product_name: string
  notes: string | null
  status: 'pending' | 'reviewed' | 'completed'
  created_at: string
}

type AggregatedProduct = {
  productName: string
  displayName: string
  count: number
  lastRequested: string
  score: number
  requests: ProductRequest[]
}

function aggregateRequests(requests: ProductRequest[]): AggregatedProduct[] {
  const byKey = new Map<string, ProductRequest[]>()
  for (const r of requests) {
    const key = r.product_name.trim().toLowerCase()
    if (!key) continue
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(r)
  }

  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  const aggregated: AggregatedProduct[] = []

  byKey.forEach((reqs, key) => {
    const sorted = [...reqs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastRequested = sorted[0].created_at
    const daysSince = (now - new Date(lastRequested).getTime()) / msPerDay
    const recencyScore = 1 / (1 + daysSince)
    const score = reqs.length + recencyScore

    aggregated.push({
      productName: key,
      displayName: sorted[0].product_name,
      count: reqs.length,
      lastRequested,
      score,
      requests: sorted,
    })
  })

  aggregated.sort((a, b) => b.score - a.score)
  return aggregated
}

function StatusBadge({ status }: { status: ProductRequest['status'] }) {
  const styles = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    reviewed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function CustomerRequestsClient({
  initialRequests,
}: {
  initialRequests: ProductRequest[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'completed'>('all')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests
    return requests.filter((r) => r.status === filter)
  }, [requests, filter])

  const aggregated = useMemo(() => aggregateRequests(filteredRequests), [filteredRequests])

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  async function updateStatus(requestId: string, status: 'reviewed' | 'completed') {
    const res = await fetch('/api/customer-product-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status }),
    })
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      )
    }
  }

  async function markAllForProduct(productKey: string, status: 'reviewed' | 'completed') {
    const group = aggregated.find((a) => a.productName === productKey)
    if (!group) return
    for (const r of group.requests) {
      await updateStatus(r.id, status)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Customer Requests</h1>
          <p className="text-slate-400">
            Product suggestions from store visitors, ranked by popularity and recency
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Reviewed</p>
                <p className="text-3xl font-bold text-blue-400">
                  {requests.filter((r) => r.status === 'reviewed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-slate-100">{requests.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {(['all', 'pending', 'reviewed', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-profit-500 text-white shadow-lg shadow-profit-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-500/30 text-amber-200 text-xs rounded">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {aggregated.length === 0 ? (
          <div className="glass-dark rounded-xl p-8 border border-slate-800 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-slate-400">
              {filter === 'all'
                ? 'No product requests yet'
                : `No ${filter} requests`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {aggregated.map((ag) => {
              const isExpanded = expandedKey === ag.productName
              const hasPending = ag.requests.some((r) => r.status === 'pending')

              return (
                <div
                  key={ag.productName}
                  className="glass-dark rounded-xl border border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedKey(isExpanded ? null : ag.productName)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-lg font-mono w-8">
                        #{aggregated.indexOf(ag) + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {ag.displayName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {ag.count} request{ag.count !== 1 ? 's' : ''} · Last: {formatDate(ag.lastRequested)}
                        </p>
                      </div>
                      {hasPending && (
                        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800 p-6 bg-slate-900/30">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Individual requests</span>
                        {hasPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => markAllForProduct(ag.productName, 'reviewed')}
                              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            >
                              Mark all reviewed
                            </button>
                            <button
                              onClick={() => markAllForProduct(ag.productName, 'completed')}
                              className="px-3 py-1.5 text-sm bg-profit-600 hover:bg-profit-500 text-white rounded-lg transition-colors"
                            >
                              Mark all completed
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {ag.requests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-start justify-between gap-4 p-4 bg-slate-800/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              {req.notes && (
                                <p className="text-slate-300 text-sm mb-2">{req.notes}</p>
                              )}
                              <p className="text-xs text-slate-500">
                                {new Date(req.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <StatusBadge status={req.status} />
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(req.id, 'reviewed')}
                                    className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                                  >
                                    Reviewed
                                  </button>
                                  <button
                                    onClick={() => updateStatus(req.id, 'completed')}
                                    className="px-3 py-1 text-xs font-medium bg-profit-600 hover:bg-profit-500 text-white rounded transition-colors"
                                  >
                                    Completed
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
