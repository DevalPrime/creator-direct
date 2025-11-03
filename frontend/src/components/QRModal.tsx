interface QRModalProps {
  show: boolean
  contractAddress: string
  onClose: () => void
  onCopy: () => void
}

export function QRModal({ show, contractAddress, onClose, onCopy }: QRModalProps) {
  if (!show) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>Share Contract</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✖
          </button>
        </div>
        <img
          alt="QR Large"
          width={360}
          height={360}
          className="qr-image"
          src={`https://chart.googleapis.com/chart?chs=600x600&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={onCopy}>
            Copy Address
          </button>
          <a
            className="btn btn-secondary"
            href={`https://chart.googleapis.com/chart?chs=600x600&cht=qr&chl=${encodeURIComponent(contractAddress)}`}
            download="creator-direct-qr.png"
          >
            Download QR
          </a>
        </div>
      </div>
    </div>
  )
}
