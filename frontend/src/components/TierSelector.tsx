import React from 'react'

interface TierSelectorProps {
  selectedTier: number
  onTierChange: (tier: number) => void
  tierPrices: { bronze: bigint; silver: bigint; gold: bigint }
  disabled?: boolean
}

const TierSelector: React.FC<TierSelectorProps> = ({
  selectedTier,
  onTierChange,
  tierPrices,
  disabled = false,
}) => {
  const tiers = [
    {
      id: 0,
      name: 'Bronze',
      icon: '🥉',
      color: '#cd7f32',
      price: tierPrices.bronze,
      description: 'Basic access',
    },
    {
      id: 1,
      name: 'Silver',
      icon: '🥈',
      color: '#c0c0c0',
      price: tierPrices.silver,
      description: 'Enhanced access',
    },
    {
      id: 2,
      name: 'Gold',
      icon: '🥇',
      color: '#ffd700',
      price: tierPrices.gold,
      description: 'Premium access',
    },
  ]

  const formatPrice = (price: bigint): string => {
    if (price === 0n) return 'Not set'
    const sby = Number(price) / 1e18
    return `${sby.toFixed(2)} SBY`
  }

  return (
    <div className="tier-selector">
      <label className="form-label">Subscription Tier</label>
      <div className="tier-grid">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            className={`tier-card ${selectedTier === tier.id ? 'tier-card-selected' : ''}`}
            onClick={() => onTierChange(tier.id)}
            disabled={disabled}
            style={{
              borderColor: selectedTier === tier.id ? tier.color : undefined,
            }}
          >
            <div className="tier-icon">{tier.icon}</div>
            <div className="tier-name">{tier.name}</div>
            <div className="tier-price">{formatPrice(tier.price)}</div>
            <div className="tier-description">{tier.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TierSelector
