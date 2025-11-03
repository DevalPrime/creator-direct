import { useState, useCallback } from 'react'
import { Toast } from '../types'
import { TOAST_DURATION_MS } from '../constants'

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((text: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION_MS)
  }, [])

  return { toasts, notify }
}
