import type { ChainParams, SubInfo } from '../types'
import { QUICK_FILL_AMOUNTS, BLOCK_TIME_MS } from '../constants'
import { calculatePeriods, estimateExpiryTime } from '../utils'

interface SubscriptionFormProps {
  pricePerPeriod: string
  chainParams: ChainParams | null
  subInfo: SubInfo | null
  currentBlock: number
  isBusy: boolean
  account: string
  contractAddress: string
  onPriceChange: (value: string) => void
  onSubscribe: () => void
  onCheckContract: () => void
}

export function SubscriptionForm({
  pricePerPeriod,
  chainParams,
  subInfo,
  currentBlock,
  isBusy,
  account,
  contractAddress,
  onPriceChange,
  onSubscribe,
  onCheckContract,
}: SubscriptionFormProps) {
  const renderEstimate = () => {
    if (!chainParams) return null

    try {
      const paying = BigInt(pricePerPeriod || '0')
      const per = chainParams.price
      if (per === 0n) return null

      const periods = calculatePeriods(paying, per)
      const base = subInfo?.active && subInfo?.expiry ? subInfo.expiry : currentBlock
      const { blocks, hours, mins } = estimateExpiryTime(
        periods,
        chainParams.period,
        base,
        currentBlock
      )

      return (
        <span>
          Paying ≈ <strong>{periods}</strong> period(s) • adds ~<strong>{blocks}</strong> blocks ≈{' '}
          <strong>
            {hours}h {mins}m
          </strong>
        </span>
      )
    } catch {
      return null
    }
  }

  return (
    <div>
      <div className="form-group">
        <label className="form-label">💰 Payment amount (plancks) - Amount you want to pay</label>
        <input
          value={pricePerPeriod}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="1000000000000000000"
        />
        <div className="form-hint">1 SBY = 1000000000000000000 plancks (18 zeros)</div>
        <div className="form-hint">
          Quick fill:{' '}
          {QUICK_FILL_AMOUNTS.map((n) => (
            <button
              key={n}
              className="btn btn-secondary btn-small"
              onClick={() => onPriceChange(String(BigInt(n) * 1_000_000_000_000_000_000n))}
            >
              {n} SBY
            </button>
          ))}
        </div>
        {chainParams && (
          <div className="form-hint" style={{ marginTop: 8, color: '#0070f3' }}>
            {renderEstimate()}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={onSubscribe}
          disabled={isBusy || !account || !contractAddress}
        >
          {isBusy ? '⏳ Processing...' : '💳 Subscribe & Pay'}
        </button>
        <button className="btn btn-secondary" onClick={onCheckContract}>
          Check Contract
        </button>
      </div>
    </div>
  )
}
