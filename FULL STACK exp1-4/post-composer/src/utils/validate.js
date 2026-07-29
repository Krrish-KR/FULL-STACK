// Pure, dependency-free validation logic so it can be unit tested in isolation
// from the React tree.

const HASHTAG_RE = /#[\p{L}0-9_]+/gu
const MENTION_RE = /@[\w.]+/g
const URL_RE = /https?:\/\/\S+/g
const X_URL_WEIGHT = 23 // X counts any URL as exactly 23 characters

export function extractTokens(text) {
  return {
    hashtags: text.match(HASHTAG_RE) || [],
    mentions: text.match(MENTION_RE) || [],
    urls: text.match(URL_RE) || []
  }
}

// X (Twitter) applies a fixed weight per URL instead of raw length.
export function weightedLength(text, platform) {
  if (platform.id !== 'x') return [...text].length
  const urls = text.match(URL_RE) || []
  let stripped = text
  urls.forEach((u) => {
    stripped = stripped.replace(u, '')
  })
  return [...stripped].length + urls.length * X_URL_WEIGHT
}

export function validatePost(text, platform, mediaCount = 0) {
  const trimmed = text.trim()
  const { hashtags, mentions } = extractTokens(text)
  const length = weightedLength(text, platform)
  const ratio = platform.charLimit === 0 ? 0 : length / platform.charLimit

  const errors = []
  const warnings = []

  if (trimmed.length === 0) {
    errors.push('Post is empty. Add copy before scheduling.')
  }

  if (length > platform.charLimit) {
    errors.push(
      `${length - platform.charLimit} character${
        length - platform.charLimit === 1 ? '' : 's'
      } over the ${platform.charLimit.toLocaleString()} limit.`
    )
  } else if (ratio >= platform.warnAt) {
    warnings.push(
      `Approaching limit: ${length.toLocaleString()} / ${platform.charLimit.toLocaleString()} characters used.`
    )
  }

  if (hashtags.length > platform.maxHashtags) {
    errors.push(
      `${hashtags.length} hashtags used, max is ${platform.maxHashtags}.`
    )
  } else if (hashtags.length > 0 && hashtags.length === platform.maxHashtags) {
    warnings.push(`At the hashtag limit (${platform.maxHashtags}).`)
  }

  if (mentions.length > platform.maxMentions) {
    errors.push(
      `${mentions.length} mentions used, max is ${platform.maxMentions}.`
    )
  }

  if (mediaCount > platform.maxMedia) {
    errors.push(
      `${mediaCount} media items attached, max is ${platform.maxMedia}.`
    )
  }

  const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'

  return {
    platformId: platform.id,
    length,
    ratio: Math.min(ratio, 1),
    hashtagCount: hashtags.length,
    mentionCount: mentions.length,
    errors,
    warnings,
    status
  }
}
