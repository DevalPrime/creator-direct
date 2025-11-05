import React, { useState } from 'react'

interface GiftSubscriptionProps {
  onGift: (recipient: string, tier: number) => void
  tierPrices: { bronze: bigint; silver: bigint; gold: bigint }
  disabled?: boolean
}

const GiftSubscription: React.FC<GiftSubscriptionProps> = ({
  onGift,
  tierPrices,
  disabled = false,
}) => {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [selectedTier, setSelectedTier] = useState(0)
  const [showForm, setShowForm] = useState(false)

  const handleGift = () => {
    if (!recipientAddress) {
      alert('Please enter recipient address')
      return
    }
    onGift(recipientAddress, selectedTier)
    setRecipientAddress('')
    setShowForm(false)
  }

  const formatPrice = (price: bigint): string => {
    if (price === 0n) return 'Not set'
    const sby = Number(price) / 1e18
    return `${sby.toFixed(2)} SBY`
  }

  const tiers = [
    { id: 0, name: 'Bronze', icon: '🥉', price: tierPrices.bronze },
    { id: 1, name: 'Silver', icon: '🥈', price: tierPrices.silver },
    { id: 2, name: 'Gold', icon: '🥇', price: tierPrices.gold },
  ]

  if (!showForm) {
    return (
      <div className="gift-section">
        <button
          className="btn btn-secondary"
          onClick={() => setShowForm(true)}
          disabled={disabled}
        >
          🎁 Gift a Subscription
        </button>
      </div>
    )
  }

  return (
    <div className="gift-section-expanded">
      <div className="form-group">
        <label className="form-label">🎁 Gift Subscription</label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Recipient wallet address..."
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Select Tier</label>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(Number(e.target.value))}
          disabled={disabled}
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.icon} {tier.name} - {formatPrice(tier.price)}
            </option>
          ))}
        </select>
      </div>
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleGift} disabled={disabled}>
          Send Gift
        </button>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={disabled}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default GiftSubscription
