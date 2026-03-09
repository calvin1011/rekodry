'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

interface CountUpProps {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}

export default function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1,
  decimals = 0,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      onUpdate: (v) =>
        setDisplayValue(decimals > 0 ? Math.round(v * 10 ** decimals) / 10 ** decimals : Math.floor(v)),
    })
    return () => controls.stop()
  }, [to, duration, decimals])

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.floor(displayValue).toLocaleString('en-US')

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
