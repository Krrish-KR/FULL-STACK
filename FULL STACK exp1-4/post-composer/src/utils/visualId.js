// Turns an entity id/text into a stable "fingerprint" - a hue pair for a
// small gradient avatar, plus initials pulled from the text - so that two
// posts sitting next to each other in a list are visually distinguishable
// even before you read the copy. Pure function of the id, so the same
// entity always renders the same way across renders and reloads.

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // force 32-bit int
  }
  return Math.abs(hash)
}

export function hueFromId(id) {
  return hashString(id) % 360
}

export function gradientFromId(id) {
  const h1 = hueFromId(id)
  const h2 = (h1 + 42) % 360
  return `linear-gradient(135deg, hsl(${h1}, 70%, 55%), hsl(${h2}, 70%, 40%))`
}

export function initialsFromText(text) {
  const cleaned = text.replace(/[#@]/g, '').trim()
  if (!cleaned) return '··'
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function shortId(id) {
  return id.replace(/^(seed-post-|draft-|post-)/, '').slice(-6)
}
