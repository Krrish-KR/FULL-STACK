import { extractTokens } from '../utils/validate.js'

export default function ComposerPanel({ text, onChange, mediaCount, onMediaChange }) {
  const { hashtags, mentions, urls } = extractTokens(text)

  return (
    <div className="panel">
      <div className="panel-label">02 · Draft</div>
      <textarea
        className="composer-textarea"
        placeholder="Write once, publish everywhere. Start typing your post..."
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="composer-toolbar">
        <div>
          <span className="token-chip">{[...text].length} chars (raw)</span>
          <span className="token-chip">#{hashtags.length} tags</span>
          <span className="token-chip">@{mentions.length} mentions</span>
          {urls.length > 0 && <span className="token-chip">{urls.length} link(s)</span>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          media attached
          <input
            type="number"
            min={0}
            max={20}
            value={mediaCount}
            onChange={(e) => onMediaChange(Math.max(0, Number(e.target.value) || 0))}
            style={{
              width: 44,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '3px 6px',
              fontFamily: 'var(--mono)'
            }}
          />
        </label>
      </div>
    </div>
  )
}
