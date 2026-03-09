'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type StorefrontMobileContextValue = {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
}

const StorefrontMobileContext = createContext<StorefrontMobileContextValue | null>(null)

export function StorefrontMobileProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), [])
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  return (
    <StorefrontMobileContext.Provider
      value={{ mobileMenuOpen, setMobileMenuOpen, openMobileMenu, closeMobileMenu }}
    >
      {children}
    </StorefrontMobileContext.Provider>
  )
}

export function useStorefrontMobile() {
  const ctx = useContext(StorefrontMobileContext)
  if (!ctx) throw new Error('useStorefrontMobile must be used within StorefrontMobileProvider')
  return ctx
}
