import { createSelector } from '@reduxjs/toolkit'
import { postsSelectors } from '../slices/postsSlice.js'
import { selectPlatformsById } from './platformsSelectors.js'

export const selectFilters = (state) => state.ui.filters

// Adapter-backed base selector - already memoized by createEntityAdapter,
// sorted by createdAt via the slice's sortComparer.
export const selectAllPosts = postsSelectors.selectAll

// Filtering by search text / platform / status. Recomputes only when the
// post list or the filter values change - typing in the composer (a
// different slice) never triggers this.
export const selectFilteredPosts = createSelector(
  [selectAllPosts, selectFilters],
  (posts, filters) => {
    const search = filters.search.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesSearch = search === '' || post.text.toLowerCase().includes(search)
      const matchesPlatform =
        filters.platformId === 'all' || post.platformIds.includes(filters.platformId)
      const matchesStatus = filters.status === 'all' || post.status === filters.status
      return matchesSearch && matchesPlatform && matchesStatus
    })
  }
)

function dateKey(iso) {
  return iso.slice(0, 10) // YYYY-MM-DD
}

// Groups filtered posts by calendar day. This is the kind of derivation
// you do NOT want running on every render of a 30-cell calendar grid, so
// it's memoized once here and every <CalendarDay> just reads its own key.
export const selectCalendarEvents = createSelector(selectFilteredPosts, (posts) => {
  const byDate = {}
  posts.forEach((post) => {
    const key = dateKey(post.createdAt)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(post)
  })
  return byDate
})

// Aggregation for the analytics dashboard: totals, per-platform share, and
// a rolling average length. Also memoized so the dashboard doesn't
// recompute on unrelated state changes (e.g. composer text).
export const selectAnalytics = createSelector(
  [selectAllPosts, selectPlatformsById],
  (posts, platformsById) => {
    const perPlatform = {}
    let totalLength = 0
    let totalHashtags = 0
    const todayKey = dateKey(new Date().toISOString())
    let postsToday = 0

    posts.forEach((post) => {
      totalLength += post.length || 0
      totalHashtags += post.hashtagCount || 0
      if (dateKey(post.createdAt) === todayKey) postsToday += 1
      post.platformIds.forEach((id) => {
        perPlatform[id] = (perPlatform[id] || 0) + 1
      })
    })

    const platformBreakdown = Object.entries(perPlatform)
      .map(([platformId, count]) => ({
        platform: platformsById[platformId],
        count,
        share: posts.length === 0 ? 0 : count / posts.length
      }))
      .sort((a, b) => b.count - a.count)

    return {
      totalPosts: posts.length,
      postsToday,
      avgLength: posts.length === 0 ? 0 : Math.round(totalLength / posts.length),
      avgHashtags: posts.length === 0 ? 0 : +(totalHashtags / posts.length).toFixed(1),
      platformBreakdown
    }
  }
)
