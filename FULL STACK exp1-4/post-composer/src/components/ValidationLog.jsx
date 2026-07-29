import PlatformIcon from './PlatformIcon.jsx'

export default function ValidationLog({ results, platformsById }) {
  const lines = []

  results.forEach((result) => {
    const platform = platformsById[result.platformId]
    result.errors.forEach((msg) =>
      lines.push({ tag: 'ERR', cls: 'err', platform, text: msg })
    )
    result.warnings.forEach((msg) =>
      lines.push({ tag: 'WARN', cls: 'warn', platform, text: msg })
    )
    if (result.errors.length === 0 && result.warnings.length === 0) {
      lines.push({
        tag: 'OK',
        cls: 'ok',
        platform,
        text: 'within all constraints, ready to publish.'
      })
    }
  })

  return (
    <div className="panel section-gap">
      <div className="panel-label">03 · Validation log</div>
      {lines.length === 0 ? (
        <div className="log-empty">Select a platform and start typing to see live checks.</div>
      ) : (
        <div className="log-list">
          {lines.map((line, i) => (
            <div className="log-line" key={i}>
              <span className={`log-tag ${line.cls}`}>[{line.tag}]</span>
              <span className="log-platform">
                <PlatformIcon platformId={line.platform.id} size={11} style={{ color: line.platform.accent }} />
                {line.platform.label}:
              </span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
