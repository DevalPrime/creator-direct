import React from 'react'

interface AnalyticsDashboardProps {
  totalSubscribers: number
  totalRevenue: bigint
  activeSubscribers: number
  isCreator: boolean
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  totalSubscribers,
  totalRevenue,
  activeSubscribers,
  isCreator,
}) => {
  if (!isCreator) {
    return null
  }

  const formatRevenue = (revenue: bigint): string => {
    const sby = Number(revenue) / 1e18
    return sby.toFixed(4)
  }

  return (
    <div className="analytics-dashboard">
      <h3 className="analytics-title">📊 Creator Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-icon">👥</div>
          <div className="analytics-value">{totalSubscribers}</div>
          <div className="analytics-label">Total Subscribers</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon">✅</div>
          <div className="analytics-value">{activeSubscribers}</div>
          <div className="analytics-label">Active Now</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon">💰</div>
          <div className="analytics-value">{formatRevenue(totalRevenue)} SBY</div>
          <div className="analytics-label">Total Revenue</div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
