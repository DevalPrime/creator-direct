import { Account } from '../types'

interface WalletSectionProps {
  account: string
  allAccounts: Account[]
  isBusy: boolean
  onConnect: () => void
  onAccountChange: (address: string) => void
}

export function WalletSection({
  account,
  allAccounts,
  isBusy,
  onConnect,
  onAccountChange,
}: WalletSectionProps) {
  return (
    <div className="wallet-section">
      <button className="btn btn-primary" onClick={onConnect} disabled={isBusy}>
        {account ? '✓ Wallet Connected' : 'Connect Wallet'}
      </button>
      {allAccounts.length > 0 && (
        <select value={account} onChange={(e) => onAccountChange(e.target.value)}>
          {allAccounts.map((a) => (
            <option key={a.address} value={a.address}>
              {a.name ? `${a.name} (${a.address.slice(0, 6)}...${a.address.slice(-4)})` : a.address}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
