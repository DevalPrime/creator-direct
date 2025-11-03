interface ProgressRingProps {
  percent: number
  label?: string
  sub?: string
}

export function ProgressRing({ percent, label, sub }: ProgressRingProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  const dash = (p / 100) * circumference

  return (
    <div className="ring">
      <svg viewBox="0 0 70 70" aria-label="progress">
        <circle cx="35" cy="35" r={radius} fill="none" stroke="#eee" strokeWidth="8" />
        <circle
          cx="35"
          cy="35"
          r={radius}
          fill="none"
          stroke="#667eea"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 35 35)"
        />
        <text x="35" y="39" textAnchor="middle" fontSize="14" fontWeight="700" fill="#333">
          {p}%
        </text>
      </svg>
      <div>
        {label && <div className="label">{label}</div>}
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  )
}
