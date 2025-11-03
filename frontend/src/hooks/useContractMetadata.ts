import { useState, useEffect } from 'react'

export function useContractMetadata() {
  const [metadata, setMetadata] = useState<unknown>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await fetch('/metadata.json')
        if (!response.ok) {
          throw new Error('Failed to load metadata')
        }
        const data = await response.json()
        setMetadata(data)
      } catch (e) {
        const err = e as Error
        setError(err)
        console.error('Failed to load metadata:', err)
      }
    }
    loadMetadata()
  }, [])

  return { metadata, error }
}
