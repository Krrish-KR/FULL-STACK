import { describe, it, expect } from 'vitest'
import postsReducer, { postPublished, postScheduled, postRescheduled, postsSelectors } from '../../store/slices/postsSlice.js'

// Reducers are pure functions, so they can be tested directly with a
// hand-built state and action - no store, no React, no mocking needed.

function emptyState() {
  return { ids: [], entities: {} }
}

describe('postsSlice reducer', () => {
  it('postPublished adds a new entity with status "published"', () => {
    const state = postsReducer(
      emptyState(),
      postPublished({
        text: 'hello',
        platformIds: ['x'],
        mediaCount: 0,
        length: 5,
        hashtagCount: 0
      })
    )
    const all = postsSelectors.selectAll({ posts: state })
    expect(all).toHaveLength(1)
    expect(all[0].status).toBe('published')
    expect(all[0].text).toBe('hello')
  })

  it('postScheduled adds a new entity with status "scheduled" on the chosen date', () => {
    const state = postsReducer(
      emptyState(),
      postScheduled({
        text: 'future post',
        platformIds: ['instagram'],
        mediaCount: 1,
        length: 11,
        hashtagCount: 0,
        date: '2030-01-15T09:00:00'
      })
    )
    const all = postsSelectors.selectAll({ posts: state })
    expect(all).toHaveLength(1)
    expect(all[0].status).toBe('scheduled')
    expect(all[0].createdAt.slice(0, 10)).toBe('2030-01-15')
  })

  it('postRescheduled moves an existing post to a new date without changing its other fields', () => {
    let state = postsReducer(
      emptyState(),
      postScheduled({
        text: 'move me',
        platformIds: ['linkedin'],
        mediaCount: 0,
        length: 7,
        hashtagCount: 0,
        date: '2030-02-01T09:00:00'
      })
    )
    const [post] = postsSelectors.selectAll({ posts: state })

    state = postsReducer(state, postRescheduled(post.id, '2030-02-10T09:00:00.000Z'))
    const [updated] = postsSelectors.selectAll({ posts: state })

    expect(updated.id).toBe(post.id)
    expect(updated.text).toBe('move me')
    expect(updated.createdAt.slice(0, 10)).toBe('2030-02-10')
  })

  it('does not mutate the previous state (immutability)', () => {
    const before = emptyState()
    const after = postsReducer(before, postPublished({ text: 'a', platformIds: ['x'], mediaCount: 0, length: 1, hashtagCount: 0 }))
    expect(before.ids).toHaveLength(0)
    expect(after.ids).toHaveLength(1)
  })
})
