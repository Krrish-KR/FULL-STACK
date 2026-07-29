import { describe, it, expect } from 'vitest'
import {
  selectAllPosts,
  selectFilteredPosts,
  selectCalendarEvents,
  selectAnalytics
} from '../../store/selectors/postsSelectors.js'

// Selectors are plain functions of `state`, so they can be tested with a
// hand-built fake root state - no store, no dispatch, no React needed.

function makeState({ posts, filters, platforms }) {
  return {
    posts: { ids: posts.map((p) => p.id), entities: Object.fromEntries(posts.map((p) => [p.id, p])) },
    ui: { filters },
    platforms: {
      ids: platforms.map((p) => p.id),
      entities: Object.fromEntries(platforms.map((p) => [p.id, p]))
    }
  }
}

const P = {
  x: { id: 'x', label: 'X', accent: '#1D9BF0' },
  instagram: { id: 'instagram', label: 'Instagram', accent: '#E1306C' }
}

const samplePosts = [
  {
    id: 'p1',
    text: 'Launch day is here',
    platformIds: ['x'],
    length: 19,
    hashtagCount: 0,
    status: 'published',
    createdAt: '2030-01-10T09:00:00.000Z'
  },
  {
    id: 'p2',
    text: 'Behind the scenes photo',
    platformIds: ['instagram'],
    length: 24,
    hashtagCount: 2,
    status: 'published',
    createdAt: '2030-01-10T14:00:00.000Z'
  },
  {
    id: 'p3',
    text: 'Scheduled teaser for next week',
    platformIds: ['x', 'instagram'],
    length: 31,
    hashtagCount: 1,
    status: 'scheduled',
    createdAt: '2030-01-20T09:00:00.000Z'
  }
]

const defaultFilters = { search: '', platformId: 'all', status: 'all' }

describe('selectAllPosts', () => {
  it('returns every post in the entity table', () => {
    const state = makeState({ posts: samplePosts, filters: defaultFilters, platforms: Object.values(P) })
    expect(selectAllPosts(state)).toHaveLength(3)
  })
})

describe('selectFilteredPosts', () => {
  it('filters by search text (case-insensitive)', () => {
    const state = makeState({
      posts: samplePosts,
      filters: { ...defaultFilters, search: 'launch' },
      platforms: Object.values(P)
    })
    const result = selectFilteredPosts(state)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
  })

  it('filters by platform', () => {
    const state = makeState({
      posts: samplePosts,
      filters: { ...defaultFilters, platformId: 'instagram' },
      platforms: Object.values(P)
    })
    const result = selectFilteredPosts(state)
    expect(result.map((p) => p.id).sort()).toEqual(['p2', 'p3'])
  })

  it('filters by status', () => {
    const state = makeState({
      posts: samplePosts,
      filters: { ...defaultFilters, status: 'scheduled' },
      platforms: Object.values(P)
    })
    const result = selectFilteredPosts(state)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p3')
  })
})

describe('selectCalendarEvents', () => {
  it('groups posts by their calendar day', () => {
    const state = makeState({ posts: samplePosts, filters: defaultFilters, platforms: Object.values(P) })
    const events = selectCalendarEvents(state)
    expect(events['2030-01-10']).toHaveLength(2)
    expect(events['2030-01-20']).toHaveLength(1)
    expect(events['2030-01-11']).toBeUndefined()
  })
})

describe('selectAnalytics', () => {
  it('computes totals and per-platform breakdown', () => {
    const state = makeState({ posts: samplePosts, filters: defaultFilters, platforms: Object.values(P) })
    const analytics = selectAnalytics(state)
    expect(analytics.totalPosts).toBe(3)

    const xRow = analytics.platformBreakdown.find((row) => row.platform.id === 'x')
    const igRow = analytics.platformBreakdown.find((row) => row.platform.id === 'instagram')
    expect(xRow.count).toBe(2) // p1 and p3
    expect(igRow.count).toBe(2) // p2 and p3
  })

  it('returns zeroed-out analytics when there are no posts', () => {
    const state = makeState({ posts: [], filters: defaultFilters, platforms: Object.values(P) })
    const analytics = selectAnalytics(state)
    expect(analytics.totalPosts).toBe(0)
    expect(analytics.avgLength).toBe(0)
    expect(analytics.platformBreakdown).toHaveLength(0)
  })
})
