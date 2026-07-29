import { useSelector } from 'react-redux'
import { selectAnalytics } from '../store/selectors/postsSelectors.js'
import PlatformIcon from './PlatformIcon.jsx'

export default function AnalyticsDashboard() {
  const analytics = useSelector(selectAnalytics)

  return (
    <div className="panel">
      <div className="panel-label">Analytics overview</div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{analytics.totalPosts}</div>
          <div className="stat-label">Total posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics.postsToday}</div>
          <div className="stat-label">Posted today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics.avgLength}</div>
          <div className="stat-label">Avg. length</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics.avgHashtags}</div>
          <div className="stat-label">Avg. hashtags</div>
        </div>
      </div>

      <div className="panel-label section-gap">Platform breakdown</div>
      {analytics.platformBreakdown.length === 0 ? (
        <div className="empty-state">No posts yet.</div>
      ) : (
        analytics.platformBreakdown.map(({ platform, count, share }) => (
          <div className="meter-block" key={platform.id}>
            <div className="meter-head">
              <span className="plat-name">
                <PlatformIcon
                  platformId={platform.id}
                  size={13}
                  style={{ color: platform.accent }}
                />
                {platform.label}
              </span>
              <span className="plat-count">{count} posts · {Math.round(share * 100)}%</span>
            </div>
            <div className="meter-track">
              <div
                className="breakdown-fill"
                style={{ width: `${Math.round(share * 100)}%`, background: platform.accent }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
