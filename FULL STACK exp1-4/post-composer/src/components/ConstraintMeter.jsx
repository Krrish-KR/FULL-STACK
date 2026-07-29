import { memo } from 'react'
import PlatformIcon from './PlatformIcon.jsx'

const SEGMENTS = 24

const statusColor = {
  ok: 'var(--signal-ok)',
  warning: 'var(--signal-warn)',
  error: 'var(--signal-err)'
}

// memo() here matters because ConstraintMeter is rendered once per
// selected platform inside a list - without it, every platform's meter
// would re-render whenever ANY platform's validation result changed.
function ConstraintMeter({ platform, result }) {
  const filledSegments = Math.round(result.ratio * SEGMENTS)

  return (
    <div className="meter-block">
      <div className="meter-head">
        <span className="plat-name">
          <PlatformIcon
            platformId={platform.id}
            size={13}
            style={{ color: platform.accent }}
          />
          {platform.label}
        </span>
        <span className="plat-count">
          {result.length.toLocaleString()} / {platform.charLimit.toLocaleString()}
        </span>
      </div>
      <div className="meter-track">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={`meter-segment${i < filledSegments ? ' filled' : ''}`}
            style={{ '--seg-color': statusColor[result.status] }}
          />
        ))}
      </div>
      <div className="meter-sub">
        <span>#{result.hashtagCount}/{platform.maxHashtags}</span>
        <span>@{result.mentionCount}/{platform.maxMentions}</span>
        <span>{Math.round(result.ratio * 100)}% used</span>
      </div>
    </div>
  )
}

export default memo(ConstraintMeter)
