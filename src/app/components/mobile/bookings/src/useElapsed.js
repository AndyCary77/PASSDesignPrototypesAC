import { useEffect, useState } from 'react'
import { formatElapsed } from './visitData'

/** "mm:ss" since `startedAt` (ms), ticking each second; null when there's no running visit. */
export function useElapsed(startedAt) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (startedAt == null) return undefined
    const t = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [startedAt])
  return startedAt == null ? '00:00' : formatElapsed(Date.now() - startedAt)
}
