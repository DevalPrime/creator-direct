interface StatusDisplayProps {
  status: string
  txHistory: string[]
}

export function StatusDisplay({ status, txHistory }: StatusDisplayProps) {
  const getAlertClass = () => {
    if (status.includes('✅')) return 'alert-success'
    if (status.includes('❌')) return 'alert-error'
    return 'alert-info'
  }

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <div className={`alert ${getAlertClass()}`}>
          <strong>Status:</strong> {status || 'Waiting...'}
        </div>
      </div>

      {txHistory.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Activity</div>
          <ul className="activity-list">
            {txHistory.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
