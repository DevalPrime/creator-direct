import React from 'react'

interface NFTPassDisplayProps {
  tokenId: number | null
  hasPass: boolean
}

const NFTPassDisplay: React.FC<NFTPassDisplayProps> = ({ tokenId, hasPass }) => {
  if (!hasPass || tokenId === null) {
    return null
  }

  return (
    <div className="nft-display">
      <div className="nft-card">
        <div className="nft-badge">NFT</div>
        <div className="nft-icon">🎫</div>
        <div className="nft-title">Access Pass</div>
        <div className="nft-token-id">Token #{tokenId}</div>
        <div className="nft-description">This NFT represents your subscription access</div>
      </div>
    </div>
  )
}

export default NFTPassDisplay
