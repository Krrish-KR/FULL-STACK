import { useSelector } from 'react-redux'
import { selectAllPlatforms } from '../store/selectors/platformsSelectors.js'
import PlatformIcon from './PlatformIcon.jsx'

export default function PlatformSelector({ selected, onToggle }) {
  const platforms = useSelector(selectAllPlatforms)

  return (
    <div className="panel">
      <div className="panel-label">01 · Target platforms</div>
      <div className="platform-list">
        {platforms.map((platform) => {
          const isActive = selected.includes(platform.id)
          return (
            <button
              key={platform.id}
              type="button"
              className={`platform-toggle${isActive ? ' active' : ''}`}
              style={{ '--platform-accent': platform.accent }}
              onClick={() => onToggle(platform.id)}
              aria-pressed={isActive}
            >
              <span className="platform-icon-badge">
                <PlatformIcon platformId={platform.id} size={13} />
              </span>
              <span className="name">{platform.label}</span>
              <span className="limit">{platform.charLimit.toLocaleString()}</span>
            </button>
          )
        })}
      </div>
      <p className="rack-hint">
        Select one or more destinations. The composer validates your draft
        against every selected platform's rules at the same time.
      </p>
    </div>
  )
}
