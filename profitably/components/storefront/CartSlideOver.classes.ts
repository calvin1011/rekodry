/** Class names for CartSlideOver. Isolated to avoid Turbopack parser misparsing / in JSX. */
export const cartSlideOverClasses = {
  overlay: 'absolute inset-0 bg-slate-950/90 animate-fade-in',
  header: 'flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800/70 bg-slate-950',
  emptyIcon: 'w-20 h-20 rounded-2xl bg-slate-800/60 flex items-center justify-center',
  list: 'divide-y divide-slate-800/60',
  listItem: 'flex gap-4 py-4 first:pt-0 hover:bg-slate-900/30 transition-colors rounded-lg -mx-2 px-2',
  itemThumb: 'relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/70',
  qtyWrap: 'flex items-center h-8 rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden',
  clearBtn: 'w-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg py-2 transition-colors',
  checkoutBtn: 'block w-full py-4 rounded-xl font-bold text-center text-white bg-gradient-profit shadow-lg shadow-profit-500/25 hover:shadow-profit-500/40 active:scale-[0.99] transition-all duration-200 touch-manipulation',
} as const
