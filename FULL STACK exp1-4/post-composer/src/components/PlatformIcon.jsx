// Small, original glyph icons - one simple, generic shape per platform
// (a crossed mark, a camera outline, a network-node cluster, a chat
// bubble) rather than a literal reproduction of each company's
// trademarked logo. Tinted with the platform's accent color wherever
// they're used, so the shape + color pairing is what makes each platform
// recognizable at a glance, alongside its text label.

const ICON_PATHS = {
  x: (
    <path
      d="M5 5L19 19M19 5L5 19"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="16.2" cy="7.8" r="1.1" fill="currentColor" />
    </>
  ),
  linkedin: (
    <>
      <circle cx="7" cy="7.5" r="2.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <circle cx="17" cy="7.5" r="2.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <circle cx="12" cy="16.5" r="2.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M8.8 9.1L10.6 14.4M15.2 9.1L13.4 14.4" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  facebook: (
    <path
      d="M6 10.5C6 6.9 8.7 4 12 4s6 2.9 6 6.5c0 3.2-2.1 5.9-4.9 6.4v-4.5h1.7l.3-2.2h-2V8.8c0-.6.3-1.2 1.3-1.2h1V5.7s-.9-.2-1.8-.2c-1.8 0-3 1.1-3 3.1v1.8H8.7v2.2h1.9V17c-2.6-.5-4.6-2.9-4.6-5.9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
  )
}

export default function PlatformIcon({ platformId, size = 16, className = '', style = {} }) {
  const path = ICON_PATHS[platformId]
  if (!path) return null

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}
