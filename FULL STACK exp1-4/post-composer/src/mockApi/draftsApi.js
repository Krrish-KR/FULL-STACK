// Fake backend for the draft CRUD workflow. Nothing here talks to a real
// server - it's an in-memory array behind an artificial delay, which is
// enough to exercise real async/loading/error UI states without needing
// an actual API.

import { verifyToken } from '../utils/jwt.js'

// Every "endpoint" below takes the bearer token the client attached to
// the request and checks it before doing anything, the same way a real
// Express/JWT middleware would gate a protected route.
function assertValidToken(token) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Unauthorized: missing or expired session token.')
  }
  return payload
}

let _db = [
  {
    id: 'draft-seed-1',
    text: 'Draft: quarterly roadmap teaser — do not publish before Monday embargo. #roadmap',
    platformIds: ['linkedin', 'x'],
    mediaCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    id: 'draft-seed-2',
    text: 'Behind the scenes look at how we build features, coming soon 👀',
    platformIds: ['instagram'],
    mediaCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  }
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const uid = () => `draft-${Date.now()}-${Math.floor(Math.random() * 10000)}`

export async function fetchDraftsApi(token) {
  await delay(500)
  assertValidToken(token)
  return [..._db].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function saveDraftApi(draft, token) {
  await delay(400)
  assertValidToken(token)
  const now = new Date().toISOString()

  if (draft.id) {
    const idx = _db.findIndex((d) => d.id === draft.id)
    if (idx === -1) throw new Error(`Draft ${draft.id} no longer exists on the server.`)
    const updated = { ..._db[idx], ...draft, updatedAt: now }
    _db[idx] = updated
    return updated
  }

  const created = { ...draft, id: uid(), updatedAt: now }
  _db = [created, ..._db]
  return created
}

export async function deleteDraftApi(id, token) {
  await delay(350)
  assertValidToken(token)
  const exists = _db.some((d) => d.id === id)
  if (!exists) throw new Error(`Draft ${id} was already removed.`)
  _db = _db.filter((d) => d.id !== id)
  return id
}
