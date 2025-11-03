import { useState, useEffect } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SHIBUYA_WS } from '../constants'

export function usePolkadotApi() {
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [currentBlock, setCurrentBlock] = useState<number>(0)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const connect = async () => {
      try {
        const provider = new WsProvider(SHIBUYA_WS)
        const apiInstance = await ApiPromise.create({ provider })
        setApi(apiInstance)
        setStatus('Connected to Shibuya')

        // Subscribe to new heads for live block number
        const unsub = await apiInstance.rpc.chain.subscribeNewHeads((header) => {
          const bn = header.number.toNumber()
          setCurrentBlock(bn)
        })

        // Type assertion for cleanup function
        unsubscribe = unsub as () => void
      } catch (e) {
        const err = e as Error
        setError(err)
        setStatus('Failed to connect to chain')
      }
    }

    connect()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return { api, currentBlock, status, error }
}
