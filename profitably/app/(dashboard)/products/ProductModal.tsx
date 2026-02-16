'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { convertHeicToJpegIfNeeded, isHeic } from '@/lib/image-upload'

interface AvailableItem {
  id: string
  name: string
  quantity_on_hand: number
  purchase_price: number
  category: string | null
  sku: string | null
}

interface ProductImage {
  id: string
  image_url: string
  alt_text: string | null
  position: number
}

interface ProductToEdit {
  id: string
  item_id: string
  title: string
  description: string | null
  price: number
  compare_at_price: number | null
  weight_oz: number
  requires_shipping: boolean
  is_published: boolean
  seo_title: string | null
  seo_description: string | null
  product_images: ProductImage[]
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  productToEdit?: ProductToEdit
  availableItems: AvailableItem[]
}

interface ImageInput {
  url: string
  alt: string
  path?: string
}

export default function ProductModal({ isOpen, onClose, productToEdit, availableItems }: ProductModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedItemId, setSelectedItemId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [weightOz, setWeightOz] = useState('')
  const [requiresShipping, setRequiresShipping] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [images, setImages] = useState<ImageInput[]>([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (productToEdit && isOpen) {
      setSelectedItemId(productToEdit.item_id)
      setTitle(productToEdit.title)
      setDescription(productToEdit.description || '')
      setPrice(productToEdit.price.toString())
      setCompareAtPrice(productToEdit.compare_at_price ? productToEdit.compare_at_price.toString() : '')
      setWeightOz(productToEdit.weight_oz.toString())
      setRequiresShipping(productToEdit.requires_shipping)
      setIsPublished(productToEdit.is_published)
      setSeoTitle(productToEdit.seo_title || '')
      setSeoDescription(productToEdit.seo_description || '')
      setImages(
        productToEdit.product_images
          .sort((a, b) => a.position - b.position)
          .map((img) => ({ url: img.image_url, alt: img.alt_text || '' }))
      )
    } else if (isOpen) {
      setSelectedItemId('')
      setTitle('')
      setDescription('')
      setPrice('')
      setCompareAtPrice('')
      setWeightOz('8')
      setRequiresShipping(true)
      setIsPublished(false)
      setSeoTitle('')
      setSeoDescription('')
      setImages([])
    }
  }, [productToEdit, isOpen])

  const selectedItem = availableItems.find((item) => item.id === selectedItemId)

  useEffect(() => {
    if (selectedItem && !productToEdit) {
      setTitle(selectedItem.name)
      setPrice(Math.ceil(selectedItem.purchase_price * 2).toString())
    }
  }, [selectedItem, productToEdit])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImage(true)
    setError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/') && !isHeic(file)) {
          setError('Only image files are allowed')
          continue
        }

        let fileToUpload: File
        try {
          fileToUpload = await convertHeicToJpegIfNeeded(file)
        } catch {
          if (isHeic(file)) {
            fileToUpload = file
          } else {
            setError('Could not convert image. Try saving as JPG or use a different file.')
            continue
          }
        }
        if (fileToUpload.size > 5 * 1024 * 1024) {
          setError('Image must be less than 5MB')
          continue
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json().catch(() => ({ error: 'Invalid response' }))

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to upload image')
        }

        setImages((prev) => [...prev, { url: data.url, alt: title || '', path: data.path }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleRemoveImage = async (index: number) => {
    const image = images[index]

    if (image.path) {
      try {
        await fetch(`/api/upload?path=${encodeURIComponent(image.path)}`, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Failed to delete image from storage:', err)
      }
    }

    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const priceNum = parseFloat(price)
      const compareAtPriceNum = compareAtPrice ? parseFloat(compareAtPrice) : null

      if (compareAtPriceNum && compareAtPriceNum < priceNum) {
        setError('Compare at price must be greater than or equal to regular price')
        setLoading(false)
        return
      }

      const url = '/api/products'
      const method = productToEdit ? 'PATCH' : 'POST'

      const baseBody = {
        item_id: selectedItemId,
        title,
        description: description || null,
        price: priceNum,
        compare_at_price: compareAtPriceNum,
        weight_oz: parseFloat(weightOz) || 0,
        requires_shipping: requiresShipping,
        is_published: isPublished,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        images: images.length > 0 ? images : null,
      }

      const body = productToEdit ? { ...baseBody, id: productToEdit.id } : baseBody

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${productToEdit ? 'update' : 'create'} product`)
      }

      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar glass-dark rounded-2xl shadow-glass-lg animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">
              {productToEdit ? 'Edit Product' : 'Create Product'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700
                       hover:bg-slate-700 transition-smooth flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {availableItems.length === 0 && !productToEdit ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">You need items in inventory with stock to create products.</p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-medium
                         bg-slate-800 text-slate-100 border border-slate-700
                         hover:bg-slate-700 hover:border-slate-600
                         transition-smooth"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="item" className="block text-sm font-medium text-slate-300 mb-2">
                  Select Inventory Item <span className="text-red-400">*</span>
                </label>
                <select
                  id="item"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  disabled={!!productToEdit}
                  className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth ${productToEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Choose an item...</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.quantity_on_hand} available ({formatCurrency(item.purchase_price)} cost)
                    </option>
                  ))}
                </select>
                {productToEdit && (
                  <p className="text-xs text-slate-500 mt-1">Item cannot be changed after creation</p>
                )}
              </div>

              {selectedItem && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Your Cost</p>
                      <p className="text-slate-100 font-medium">{formatCurrency(selectedItem.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Available Stock</p>
                      <p className="text-slate-100 font-medium">{selectedItem.quantity_on_hand} units</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                  Product Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth"
                  placeholder="Nike Air Max Shoes - Size 10"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-smooth resize-none"
                  placeholder="Describe your product, condition, features, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-300 mb-2">
                    Selling Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="89.99"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="compareAtPrice" className="block text-sm font-medium text-slate-300 mb-2">
                    Compare At Price (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="119.99"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Show original price for sales</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Product Images
                </label>

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-smooth
                    ${dragActive ? 'border-profit-500 bg-profit-500/10' : 'border-slate-700 bg-slate-800/30'}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-slate-300 font-medium">
                      {uploadingImage ? 'Uploading...' : 'Drag & drop images here'}
                    </p>
                    <p className="text-slate-500 text-sm">or</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2 rounded-lg font-medium
                               bg-slate-800 text-slate-100 border border-slate-700
                               hover:bg-slate-700 hover:border-slate-600
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-smooth"
                    >
                      Browse Files
                    </button>
                    <p className="text-slate-500 text-xs mt-2">
                      PNG, JPG, WebP up to 5MB
                    </p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.url}
                          alt={img.alt || `Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 rounded bg-red-500/80 hover:bg-red-500
                                   text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-profit-500 text-white rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weightOz" className="block text-sm font-medium text-slate-300 mb-2">
                    Weight (oz)
                  </label>
                  <input
                    id="weightOz"
                    type="number"
                    step="0.1"
                    min="0"
                    value={weightOz}
                    onChange={(e) => setWeightOz(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                             text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                             transition-smooth"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={requiresShipping}
                      onChange={(e) => setRequiresShipping(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-700 text-profit-500 focus:ring-profit-500"
                    />
                    <span className="text-sm text-slate-300">Requires Shipping</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-profit-500 focus:ring-profit-500"
                  />
                  <span className="text-sm text-slate-300">Publish product to storefront</span>
                </label>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-300 mb-2">
                  SEO Settings (Optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="seoTitle" className="block text-sm font-medium text-slate-300 mb-2">
                      SEO Title
                    </label>
                    <input
                      id="seoTitle"
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth"
                      placeholder="Custom title for search engines"
                    />
                  </div>

                  <div>
                    <label htmlFor="seoDescription" className="block text-sm font-medium text-slate-300 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      id="seoDescription"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      rows={2}
                      maxLength={160}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                               text-slate-100 placeholder-slate-500
                               focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                               transition-smooth resize-none"
                      placeholder="Custom description for search engines"
                    />
                  </div>
                </div>
              </details>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl font-medium
                           bg-slate-800 text-slate-100 border border-slate-700
                           hover:bg-slate-700 hover:border-slate-600
                           transition-smooth"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage || !selectedItemId}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold
                           bg-gradient-profit text-white
                           shadow-lg shadow-profit-500/50
                           hover:shadow-glow-profit-lg hover:scale-[1.02]
                           active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-smooth"
                >
                  {loading ? 'Saving...' : uploadingImage ? 'Uploading images...' : (productToEdit ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}