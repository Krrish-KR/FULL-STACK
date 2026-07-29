import { describe, it, expect } from 'vitest'
import { hueFromId, gradientFromId, initialsFromText, shortId } from '../../utils/visualId.js'

describe('hueFromId / gradientFromId', () => {
  it('is deterministic - the same id always produces the same hue', () => {
    expect(hueFromId('post-abc123')).toBe(hueFromId('post-abc123'))
    expect(gradientFromId('post-abc123')).toBe(gradientFromId('post-abc123'))
  })

  it('different ids are very likely to produce different hues', () => {
    expect(hueFromId('post-abc123')).not.toBe(hueFromId('post-xyz789'))
  })

  it('always returns a hue within 0-359', () => {
    for (const id of ['a', 'zzz', 'seed-post-15', 'draft-172837-4821']) {
      const hue = hueFromId(id)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })
})

describe('initialsFromText', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFromText('Hello world')).toBe('HW')
  })

  it('ignores leading hashtags and mentions', () => {
    expect(initialsFromText('#launch big day')).toBe('LB')
  })

  it('falls back to a placeholder for empty text', () => {
    expect(initialsFromText('   ')).toBe('··')
  })

  it('uses the first two letters of a single word', () => {
    expect(initialsFromText('Launch')).toBe('LA')
  })
})

describe('shortId', () => {
  it('strips known prefixes and keeps the last 6 characters', () => {
    expect(shortId('seed-post-15')).toBe('15')
    expect(shortId('draft-1721838472-9931')).toBe('2-9931')
  })
})
