/**
 * Pure cart helpers for computing totals and applying add-item logic.
 * Used by cart-context and tested in isolation.
 */

export interface CartItemLike {
  product_id: string
  price: number
  quantity: number
  max_quantity: number
}

export function computeSubtotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function computeItemCount(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Returns the new items array after adding (or merging) an item.
 * Matches the addItem logic in CartProvider.
 */
export function addItemToCart<T extends CartItemLike>(
  current: T[],
  item: T
): T[] {
  const existing = current.find((i) => i.product_id === item.product_id)
  if (existing) {
    const newQuantity = Math.min(
      existing.quantity + item.quantity,
      item.max_quantity
    )
    return current.map((i) =>
      i.product_id === item.product_id
        ? { ...i, quantity: newQuantity }
        : i
    ) as T[]
  }
  return [...current, item]
}
