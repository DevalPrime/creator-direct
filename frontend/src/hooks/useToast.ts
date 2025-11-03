import { useState, useCallback } from 'react'
import { Toast } from '../types'
import { TOAST_DURATION_MS } from '../constants'

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((text: string, type: Toast['type'] = 'info') => {
    // Use crypto.randomUUID() for robust unique ID generation
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + Math.random()
    setToasts((prev) => [...prev, { id: String(id), text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== String(id)))
    }, TOAST_DURATION_MS)
  }, [])

  return { toasts, notify }
}
