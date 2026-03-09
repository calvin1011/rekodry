'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

const STORAGE_KEY = 'rekodry_prev_profit'
const MILESTONES = [100, 500, 1000, 5000, 10000]

interface ProfitMilestoneCheckerProps {
  currentProfit: number
}

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
  })
}

export default function ProfitMilestoneChecker({ currentProfit }: ProfitMilestoneCheckerProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, String(currentProfit))
      return
    }
    const prevProfit = Number(raw)

    for (const milestone of MILESTONES) {
      if (prevProfit < milestone && currentProfit >= milestone) {
        toast.success(`Profit milestone reached!`, {
          description: `You've hit $${milestone.toLocaleString()} in total profit.`,
          duration: 5000,
        })
        fireConfetti()
        break
      }
    }

    localStorage.setItem(STORAGE_KEY, String(currentProfit))
  }, [currentProfit])

  return null
}
