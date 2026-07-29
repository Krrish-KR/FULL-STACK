import { describe, it, expect } from 'vitest'
import { createToken, decodeToken, isTokenExpired, verifyToken } from '../../utils/jwt.js'

describe('createToken() / decodeToken()', () => {
  it('produces a three-segment header.payload.signature string', () => {
    const token = createToken({ sub: 'u-1', role: 'admin' })
    expect(token.split('.')).toHaveLength(3)
  })

  it('round-trips the claims passed in', () => {
    const token = createToken({ sub: 'u-1', username: 'admin', role: 'admin' })
    const decoded = decodeToken(token)
    expect(decoded.payload.sub).toBe('u-1')
    expect(decoded.payload.username).toBe('admin')
    expect(decoded.payload.role).toBe('admin')
  })

  it('stamps iat and a later exp automatically', () => {
    const token = createToken({ sub: 'u-1' })
    const { payload } = decodeToken(token)
    expect(typeof payload.iat).toBe('number')
    expect(payload.exp).toBeGreaterThan(payload.iat)
  })

  it('returns null for a malformed token', () => {
    expect(decodeToken('not-a-jwt')).toBeNull()
    expect(decodeToken('')).toBeNull()
    expect(decodeToken(null)).toBeNull()
  })
})

describe('isTokenExpired()', () => {
  it('is false for a freshly-issued token payload', () => {
    const { payload } = decodeToken(createToken({ sub: 'u-1' }))
    expect(isTokenExpired(payload)).toBe(false)
  })

  it('is true for a payload whose exp is in the past', () => {
    const { payload } = decodeToken(createToken({ sub: 'u-1' }, { expiresInSeconds: -10 }))
    expect(isTokenExpired(payload)).toBe(true)
  })

  it('is true for a missing/malformed payload', () => {
    expect(isTokenExpired(null)).toBe(true)
    expect(isTokenExpired({})).toBe(true)
  })
})

describe('verifyToken()', () => {
  it('returns the payload for a valid, unexpired token', () => {
    const token = createToken({ sub: 'u-1', role: 'editor' })
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload.sub).toBe('u-1')
  })

  it('returns null for an expired token', () => {
    const token = createToken({ sub: 'u-1' }, { expiresInSeconds: -1 })
    expect(verifyToken(token)).toBeNull()
  })

  it('returns null if the payload segment was tampered with', () => {
    const token = createToken({ sub: 'u-1', role: 'viewer' })
    const [headerB64, , signature] = token.split('.')
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'u-1', role: 'admin', iat: 0, exp: 9999999999 })
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const forgedToken = `${headerB64}.${forgedPayload}.${signature}`
    expect(verifyToken(forgedToken)).toBeNull()
  })

  it('returns null for a garbage string', () => {
    expect(verifyToken('garbage')).toBeNull()
  })
})
