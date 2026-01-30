'use client'

import { useState, useEffect } from 'react'
import StarRating from './StarRating'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string
  is_verified_purchase: boolean
  created_at: string
  customers: {
    full_name: string
  }
  review_replies: {
    id: string
    content: string
    created_at: string
  }[]
}

interface ReviewsSectionProps {
  productId: string
  customerId: string | null
  storeName: string
  storeSlug: string
  sessionType?: 'customer' | 'guest' | 'none'
}

export default function ReviewsSection({
  productId,
  customerId,
  storeName,
  storeSlug,
  sessionType = 'none',
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)

  // Review form state
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchReviews()
    if (customerId) {
      checkExistingReview()
    }
  }, [productId, customerId])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setAverageRating(data.averageRating || 0)
      setTotalReviews(data.totalReviews || 0)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingReview = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&customerId=${customerId}`)
      const data = await res.json()
      if (data.review) {
        setHasReviewed(true)
        setExistingReview(data.review)
      }
    } catch (error) {
      console.error('Error checking existing review:', error)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      setError('Please sign in to leave a review')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerId,
          rating,
          title: title || null,
          content,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess(true)
      setShowReviewForm(false)
      setHasReviewed(true)
      fetchReviews() // Refresh reviews
      
      // Reset form
      setRating(5)
      setTitle('')
      setContent('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="glass-dark rounded-2xl p-8 mt-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-2xl p-8 mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <StarRating rating={averageRating} size="md" />
            <span className="text-slate-400">
              {averageRating.toFixed(1)} out of 5 ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {customerId && !hasReviewed && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-6 py-2.5 bg-gradient-profit text-white font-medium rounded-xl
                     hover:shadow-glow-profit-lg transition-smooth"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-profit-500/20 border border-profit-500/50 rounded-xl text-profit-400">
          Thank you for your review!
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Write Your Review</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                       text-slate-100 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Review</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="What did you like or dislike about this product?"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                       text-slate-100 placeholder-slate-500 resize-none
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !content}
              className="px-6 py-2.5 bg-gradient-profit text-white font-medium rounded-lg
                       hover:shadow-glow-profit-lg transition-smooth
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-6 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg
                       hover:bg-slate-600 transition-smooth"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-400">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-slate-700 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-100">
                      {review.customers?.full_name || 'Anonymous'}
                    </span>
                    {review.is_verified_purchase && (
                      <span className="px-2 py-0.5 text-xs bg-profit-500/20 text-profit-400 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <span className="text-sm text-slate-500">{formatDate(review.created_at)}</span>
              </div>

              {review.title && (
                <h4 className="font-semibold text-slate-100 mt-3">{review.title}</h4>
              )}
              <p className="text-slate-300 mt-2">{review.content}</p>

              {/* Seller Reply */}
              {review.review_replies && review.review_replies.length > 0 && (
                <div className="mt-4 ml-4 p-4 bg-slate-800/50 rounded-lg border-l-2 border-profit-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-profit-400">{storeName} Response</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(review.review_replies[0].created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{review.review_replies[0].content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sign in prompt */}
      {!customerId && (
        <div className="mt-6 text-center p-4 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400 mb-3">
            {sessionType === 'guest'
              ? 'You are currently signed in for order tracking. Sign in with your email to leave a review.'
              : 'Sign in with the email you used at checkout to leave a review.'}
          </p>
          <a
            href={`/store/${storeSlug}/account?tab=orders`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
                     text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            {sessionType === 'guest' ? 'Sign in to review' : 'Sign in to review'}
          </a>
        </div>
      )}
    </div>
  )
}
