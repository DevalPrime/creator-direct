import { BLOCK_TIME_MS } from './constants'

export const formatTimeRemaining = (expiryBlock: number, currentBlock: number): string => {
  const blocksLeft = Math.max(0, expiryBlock - currentBlock)
  const ms = blocksLeft * BLOCK_TIME_MS
  const hrs = Math.floor(ms / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  return `${hrs}h ${mins}m`
}

export const formatBalance = (balance: bigint, decimals = 18): string => {
  // Use string-based arithmetic to avoid precision loss with large bigint values
  const balanceStr = balance.toString()
  const len = balanceStr.length

  if (len <= decimals) {
    // Value is less than 1 unit, pad with zeros
    const padded = '0'.repeat(decimals - len + 1) + balanceStr
    return `0.${padded.slice(1, 5)}`
  }

  // Split at decimal point
  const integerPart = balanceStr.slice(0, len - decimals)
  const decimalPart = balanceStr.slice(len - decimals, len - decimals + 4)
  return `${integerPart}.${decimalPart}`
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const parseNumericString = (value: string): bigint => {
  return BigInt(value.replace(/,/g, ''))
}

export const calculatePeriods = (paying: bigint, pricePerPeriod: bigint): number => {
  if (pricePerPeriod === 0n) return 0
  return Number(paying / pricePerPeriod)
}

export const estimateExpiryTime = (
  periods: number,
  periodBlocks: number,
  baseBlock: number,
  currentBlock: number
): { blocks: number; hours: number; mins: number } => {
  const blocks = periods * periodBlocks
  const estExpiryBlock = baseBlock + blocks
  const estMs = Math.max(0, estExpiryBlock - currentBlock) * BLOCK_TIME_MS
  const hours = Math.floor(estMs / 3_600_000)
  const mins = Math.floor((estMs % 3_600_000) / 60_000)
  return { blocks, hours, mins }
}
