import { memo } from 'react'
import { gradientFromId, initialsFromText, shortId } from '../utils/visualId.js'
import PlatformIcon from './PlatformIcon.jsx'

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// One shared card for anything that is "a piece of content with platforms,
// a status, and a timestamp" - published posts (Calendar) and saved
// drafts (Drafts panel) both render through this so they look and behave
// consistently, while the avatar/id fingerprint keeps every individual
// item visually distinct.
function EntityCard({
  id,
  text,
  platformIds,
  platformsById,
  timestamp,
  statusLabel,
  statusVariant,
  mediaCount = 0,
  length,
  hashtagCount = 0,
  actions,
  draggable = false,
  onDragStart,
  onDragEnd
}) {
  const chars = length ?? [...text].length

  return (
    <div
      className={`entity-card${draggable ? ' entity-card-draggable' : ''}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart?.(e, id) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
    >
      {draggable && (
        <span className="entity-drag-handle" title="Drag to reschedule">
          ⠿
        </span>
      )}
      <div className="entity-avatar-wrap">
        <div className="entity-avatar" style={{ background: gradientFromId(id) }}>
          {initialsFromText(text)}
        </div>
        {platformIds[0] && platformsById[platformIds[0]] && (
          <span
            className="entity-avatar-badge"
            style={{ '--platform-accent': platformsById[platformIds[0]].accent }}
          >
            <PlatformIcon platformId={platformIds[0]} size={9} />
          </span>
        )}
      </div>

      <div className="entity-body">
        <div className="entity-head">
          <span className="entity-id">#{shortId(id)}</span>
          {statusLabel && (
            <span className={`entity-status entity-status-${statusVariant}`}>{statusLabel}</span>
          )}
          <span className="entity-time">{formatTimestamp(timestamp)}</span>
        </div>

        <p className="entity-text">{text || '(empty)'}</p>

        <div className="entity-footer">
          <div className="entity-chips">
            {platformIds.map((pid) => {
              const platform = platformsById[pid]
              if (!platform) return null
              return (
                <span
                  key={pid}
                  className="draft-chip"
                  style={{ '--platform-accent': platform.accent }}
                >
                  <PlatformIcon platformId={pid} size={10} />
                  {platform.label}
                </span>
              )
            })}
          </div>
          <div className="entity-stats">
            <span>{chars} chars</span>
            <span>#{hashtagCount}</span>
            <span>{mediaCount} media</span>
          </div>
        </div>

        {actions && <div className="draft-actions section-gap-sm">{actions}</div>}
      </div>
    </div>
  )
}

export default memo(EntityCard)
