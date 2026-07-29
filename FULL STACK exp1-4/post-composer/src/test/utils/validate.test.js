import { describe, it, expect } from 'vitest'
import { validatePost, extractTokens, weightedLength } from '../../utils/validate.js'
import { getPlatform } from '../../data/platforms.js'

const x = getPlatform('x')
const instagram = getPlatform('instagram')

describe('extractTokens', () => {
  it('finds hashtags, mentions, and urls in text', () => {
    const { hashtags, mentions, urls } = extractTokens(
      'Check this out #launch #big @teammate https://example.com'
    )
    expect(hashtags).toEqual(['#launch', '#big'])
    expect(mentions).toEqual(['@teammate'])
    expect(urls).toEqual(['https://example.com'])
  })

  it('returns empty arrays when there is nothing to find', () => {
    const { hashtags, mentions, urls } = extractTokens('just plain text')
    expect(hashtags).toHaveLength(0)
    expect(mentions).toHaveLength(0)
    expect(urls).toHaveLength(0)
  })
})

describe('weightedLength', () => {
  it('counts a URL on X as exactly 23 characters regardless of its real length', () => {
    const short = 'go here: https://a.co'
    const withLongUrl = 'go here: https://example.com/a/very/long/path/that/is/way/over/23/chars'
    const lenShort = weightedLength(short, x)
    const lenLong = weightedLength(withLongUrl, x)
    // both should be "go here: " (9 chars) + 23 for the URL = 32
    expect(lenShort).toBe(32)
    expect(lenLong).toBe(32)
  })

  it('uses raw character length on platforms other than X', () => {
    const text = 'https://example.com'
    expect(weightedLength(text, instagram)).toBe([...text].length)
  })
})

describe('validatePost', () => {
  it('flags an empty post as an error', () => {
    const result = validatePost('   ', x, 0)
    expect(result.status).toBe('error')
    expect(result.errors.some((e) => e.includes('empty'))).toBe(true)
  })

  it('passes a short, well-formed post with no errors or warnings', () => {
    const result = validatePost('Hello world', x, 0)
    expect(result.status).toBe('ok')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('errors when the character limit is exceeded', () => {
    const longText = 'a'.repeat(300)
    const result = validatePost(longText, x, 0)
    expect(result.status).toBe('error')
    expect(result.errors.some((e) => e.includes('over the'))).toBe(true)
  })

  it('warns (but does not error) when approaching the limit', () => {
    const nearLimitText = 'a'.repeat(Math.floor(x.charLimit * 0.95))
    const result = validatePost(nearLimitText, x, 0)
    expect(result.status).toBe('warning')
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('errors when too many hashtags are used for the platform', () => {
    const manyHashtags = Array.from({ length: instagram.maxHashtags + 5 }, (_, i) => `#tag${i}`).join(' ')
    const result = validatePost(manyHashtags, instagram, 0)
    expect(result.status).toBe('error')
    expect(result.hashtagCount).toBe(instagram.maxHashtags + 5)
  })

  it('errors when media count exceeds the platform max', () => {
    const result = validatePost('a valid post', x, x.maxMedia + 1)
    expect(result.errors.some((e) => e.includes('media'))).toBe(true)
  })
})
