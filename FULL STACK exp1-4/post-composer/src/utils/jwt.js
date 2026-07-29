// Minimal, dependency-free JWT *simulation* for the frontend auth experiment.
//
// This is NOT cryptographically secure — there is no real HMAC secret held
// server-side, since there is no server. It exists to demonstrate the JWT
// *shape and workflow* (header.payload.signature, base64url encoding,
// expiry, tamper detection) that a real token-based auth system uses:
//   - `createToken`  → what a backend would do after a successful login
//   - `decodeToken`  → what a client does to read claims out of a token
//     it was handed, without needing the secret
//   - `verifyToken`  → what a backend (or, here, the mock API layer
//     standing in for one) does to check a token wasn't tampered with and
//     hasn't expired before trusting it
//
// In a real app, `SIMULATED_SECRET` would live only on the server and the
// signature would use an actual HMAC (or RSA) implementation.

const SIMULATED_SECRET = 'post-composer-mock-secret-do-not-use-in-prod'

function base64UrlEncode(str) {
  const base64 = typeof window !== 'undefined' && window.btoa
    ? window.btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, 'utf-8').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  )
  const base64 = typeof window !== 'undefined' && window.atob
    ? decodeURIComponent(escape(window.atob(padded)))
    : Buffer.from(padded, 'base64').toString('utf-8')
  return base64
}

// A small, fast, non-cryptographic string hash (djb2), used only to give
// the mock token a signature-shaped third segment that changes if the
// header or payload is altered — enough to demonstrate tamper detection
// in the UI without pulling in a real crypto library.
function djb2Hash(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function sign(headerB64, payloadB64) {
  return djb2Hash(`${headerB64}.${payloadB64}.${SIMULATED_SECRET}`)
}

/**
 * Build a mock JWT for the given claims. Adds standard `iat`/`exp` claims
 * automatically (expressed in whole seconds, like a real JWT).
 */
export function createToken(claims, { expiresInSeconds = 60 * 60 } = {}) {
  const header = { alg: 'HS256-SIM', typ: 'JWT' }
  const nowSeconds = Math.floor(Date.now() / 1000)
  const payload = {
    ...claims,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(headerB64, payloadB64)

  return `${headerB64}.${payloadB64}.${signature}`
}

/**
 * Decode a token's header/payload WITHOUT checking the signature or
 * expiry — analogous to a frontend reading claims out of a token it
 * already trusts (e.g. to show a username) without re-verifying it.
 * Returns null if the token isn't well-formed.
 */
export function decodeToken(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return { header, payload, signature: parts[2] }
  } catch {
    return null
  }
}

export function isTokenExpired(payload) {
  if (!payload || typeof payload.exp !== 'number') return true
  return Math.floor(Date.now() / 1000) >= payload.exp
}

/**
 * Full validation: well-formed, signature matches (i.e. header/payload
 * weren't tampered with after issuance), and not expired. Returns the
 * decoded payload on success, or null on any failure — this is what a
 * protected mock-API endpoint calls before trusting a token.
 */
export function verifyToken(token) {
  const decoded = decodeToken(token)
  if (!decoded) return null

  const [headerB64, payloadB64] = token.split('.')
  const expectedSignature = sign(headerB64, payloadB64)
  if (expectedSignature !== decoded.signature) return null

  if (isTokenExpired(decoded.payload)) return null

  return decoded.payload
}
