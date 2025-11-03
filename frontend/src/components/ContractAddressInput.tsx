interface ContractAddressInputProps {
  contractAddress: string
  contractInfo: string
  onChange: (address: string) => void
  onBlur: () => void
  onCopy: () => void
}

export function ContractAddressInput({
  contractAddress,
  contractInfo,
  onChange,
  onBlur,
  onCopy,
}: ContractAddressInputProps) {
  return (
    <div className="form-group">
      <label className="form-label">Contract Address</label>
      <div className="input-with-btn">
        <input
          value={contractAddress}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Paste your deployed contract address..."
        />
        <button className="btn btn-ghost btn-icon" onClick={onCopy} title="Copy address">
          📋
        </button>
      </div>
      {contractInfo && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: '#f0f7ff',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {contractInfo}
        </div>
      )}
    </div>
  )
}
