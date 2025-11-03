import type { ChainParams, SubInfo } from '../types'
import { ProgressRing } from './ProgressRing'
import { formatTimeRemaining, formatBalance } from '../utils'

interface SubscriptionStatusProps {
  contractAddress: string
  chainParams: ChainParams | null
  subInfo: SubInfo | null
  currentBlock: number
  contractBalance: bigint
  account: string
  isBusy: boolean
  onShowQr: () => void
  onRefreshBalance: () => void
  onWithdraw: () => void
}

export function SubscriptionStatus({
  contractAddress,
  chainParams,
  subInfo,
  currentBlock,
  contractBalance,
  account,
  isBusy,
  onShowQr,
  onRefreshBalance,
  onWithdraw,
}: SubscriptionStatusProps) {
  if (!contractAddress) return null

  const humanTimeRemaining =
    subInfo && subInfo.expiry && currentBlock
      ? formatTimeRemaining(subInfo.expiry, currentBlock)
      : ''

  const progressPercent =
    chainParams && subInfo?.active
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(((subInfo.expiry - currentBlock) / Math.max(1, chainParams.period)) * 100)
          )
        )
      : 0

  return (
    <div>
      <div className="card card-info" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>Subscription Status</div>
          {chainParams && subInfo?.active && (
            <ProgressRing
              percent={progressPercent}
              label={humanTimeRemaining || '—'}
              sub={`until expiry (block #${subInfo.expiry})`}
            />
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <span
            className={`status-badge ${subInfo?.active ? 'status-badge-success' : 'status-badge-error'}`}
          >
            {subInfo?.active ? '✓ Active' : '✗ Not active'}
          </span>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Share</div>
          <img
            alt="QR Code"
            width={120}
            height={120}
            className="qr-image"
            onClick={onShowQr}
            style={{ cursor: 'pointer' }}
            src={`https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Creator Dashboard</div>
        <div style={{ marginBottom: 12 }}>
          Contract balance: <strong>{formatBalance(contractBalance)} SBY</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onRefreshBalance}>
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={onWithdraw}
            disabled={isBusy || (!!chainParams && chainParams.creator !== account)}
          >
            Withdraw
          </button>
          {chainParams && chainParams.creator !== account && (
            <span style={{ fontSize: 12, color: '#777' }}>Creator only</span>
          )}
        </div>
      </div>
    </div>
  )
}
