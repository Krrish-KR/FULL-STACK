import PlatformIcon from './PlatformIcon.jsx'

export default function PreviewPanel({ platforms, text }) {
  if (platforms.length === 0) {
    return (
      <div className="panel">
        <div className="panel-label">Preview</div>
        <div className="empty-state">No platform selected yet.</div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-label">Preview</div>
      {platforms.map((platform) => {
        const chars = [...text]
        const clipped = chars.length > platform.previewChars
        const shown = clipped
          ? chars.slice(0, platform.previewChars).join('')
          : text

        return (
          <div
            className="preview-card"
            key={platform.id}
            style={{ '--platform-accent': platform.accent }}
          >
            <div className="preview-head">
              <span className="preview-avatar">
                <PlatformIcon platformId={platform.id} size={13} style={{ color: '#fff' }} />
              </span>
              <span className="preview-handle">{platform.handle}</span>
              <span className="preview-platform-tag">
                <PlatformIcon platformId={platform.id} size={10} />
                {platform.label}
              </span>
            </div>
            <div className="preview-body">
              {shown || 'Your post will appear here...'}
              {clipped && <span className="preview-more"> …more</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
