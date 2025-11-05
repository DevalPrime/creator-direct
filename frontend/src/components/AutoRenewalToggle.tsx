import React from 'react'

interface AutoRenewalToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
}

const AutoRenewalToggle: React.FC<AutoRenewalToggleProps> = ({
  isEnabled,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="auto-renewal-section">
      <div className="toggle-container">
        <label className="toggle-label">
          <span className="toggle-text">
            🔄 Auto-Renewal {isEnabled ? '(Enabled)' : '(Disabled)'}
          </span>
          <span className="toggle-description">
            Automatically renew subscription when it expires
          </span>
        </label>
        <button
          className={`toggle-btn ${isEnabled ? 'toggle-btn-on' : 'toggle-btn-off'}`}
          onClick={() => onToggle(!isEnabled)}
          disabled={disabled}
        >
          <span className="toggle-slider" />
        </button>
      </div>
      {isEnabled && (
        <div className="toggle-note">
          ⚠️ Note: Auto-renewal requires sufficient balance. Manual renewal will be needed if
          balance is insufficient.
        </div>
      )}
    </div>
  )
}

export default AutoRenewalToggle
