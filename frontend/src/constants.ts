export const SHIBUYA_WS = import.meta.env.VITE_SHIBUYA_WS || 'wss://rpc.shibuya.astar.network'
export const BLOCK_TIME_MS = Number(import.meta.env.VITE_BLOCK_TIME_MS) || 12_000 // Shibuya ~12s per block
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CreatorDirect'

export const GAS_LIMITS = {
  QUERY: {
    refTime: 10_000_000_000n,
    proofSize: 500_000n,
  },
  SUBSCRIPTION_QUERY: {
    refTime: 8_000_000_000n,
    proofSize: 200_000n,
  },
  SUBSCRIBE_DRY_RUN: {
    refTime: 30_000_000_000n,
    proofSize: 1_000_000n,
  },
  UPDATE_PARAMS: {
    refTime: 10_000_000_000n,
    proofSize: 500_000n,
  },
  WITHDRAW: {
    refTime: 10_000_000_000n,
    proofSize: 500_000n,
  },
} as const

export const QUICK_FILL_AMOUNTS = [1, 5, 10] as const

export const MIN_GAS_BUFFER = BigInt(100_000_000_000_000_000) // 0.1 SBY for gas
export const TOAST_DURATION_MS = 3200
export const GAS_MULTIPLIER = 3n // Buffer for actual transaction
