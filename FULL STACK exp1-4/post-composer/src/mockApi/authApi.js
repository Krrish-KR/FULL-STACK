// Fake auth backend. In a real app this would be a POST /login call;
// here it's an in-memory lookup behind an artificial delay so the login
// screen has real async/loading/error states to demonstrate.

import { createToken, verifyToken } from '../utils/jwt.js'

const MOCK_USERS = [
  { id: 'u-admin', username: 'admin', password: 'admin123', name: 'Krrish Kumar', role: 'admin' },
  { id: 'u-editor', username: 'editor', password: 'editor123', name: 'Leo Fontaine', role: 'editor' },
  { id: 'u-viewer', username: 'viewer', password: 'viewer123', name: 'Priya Nair', role: 'viewer' }
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory audit log. Every attempt - successful or not - gets recorded,
// which is what a real login endpoint would log server-side for security
// review. Newest first.
let LOGIN_HISTORY = []
let _historySeq = 0

function recordAttempt({ username, name, role, success }) {
  _historySeq += 1
  LOGIN_HISTORY = [
    {
      id: `login-${_historySeq}`,
      username,
      name: name || username,
      role: role || null,
      success,
      at: new Date().toISOString()
    },
    ...LOGIN_HISTORY
  ].slice(0, 50) // cap the log so it can't grow unbounded in a long session
}

export async function loginApi(username, password) {
  await delay(500)
  const match = MOCK_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  )

  if (!match) {
    recordAttempt({ username: username.trim() || '(empty)', success: false })
    throw new Error('Invalid username or password.')
  }

  recordAttempt({ username: match.username, name: match.name, role: match.role, success: true })

  // Never send the password back, even in a mock.
  const { password: _pw, ...safeUser } = match

  // Simulate what a real backend does after checking credentials: mint a
  // signed, expiring token that encodes just enough to identify the user
  // and their role, and hand it back alongside the profile. The frontend
  // then uses this token — not the raw credentials — for every
  // subsequent "authenticated" call.
  const token = createToken({
    sub: safeUser.id,
    username: safeUser.username,
    name: safeUser.name,
    role: safeUser.role
  })

  return { user: safeUser, token }
}

// Stand-in for a backend re-validating a bearer token on a protected
// route: check the signature, check expiry, and (since this is a mock)
// confirm the user still exists. Real middleware would do the same
// three checks, just against a real signing key and user store.
function assertValidToken(token, { requireRole } = {}) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Unauthorized: missing or expired session token.')
  }
  const stillExists = MOCK_USERS.some((u) => u.id === payload.sub)
  if (!stillExists) {
    throw new Error('Unauthorized: account no longer exists.')
  }
  if (requireRole && payload.role !== requireRole) {
    throw new Error(`Forbidden: ${requireRole} role required.`)
  }
  return payload
}

export async function getLoginHistoryApi(token) {
  await delay(300)
  assertValidToken(token, { requireRole: 'admin' })
  return [...LOGIN_HISTORY]
}

// Exposed for the Admin tab's read-only directory view (no passwords).
export function listUsersApi() {
  return MOCK_USERS.map(({ password: _pw, ...safeUser }) => safeUser)
}
