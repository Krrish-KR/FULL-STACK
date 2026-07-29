import { createSlice, createEntityAdapter, nanoid } from '@reduxjs/toolkit'
import { buildSeedPosts } from '../../data/seedPosts.js'

// createEntityAdapter gives us the { ids: [], entities: {} } normalized
// shape "for free", plus a set of CRUD helper functions (addOne, upsertOne,
// removeOne, setAll, ...) and a getSelectors() factory - this is the
// standard Redux Toolkit way to design normalized state, rather than
// hand-rolling byId/allIds bookkeeping in every reducer.
const postsAdapter = createEntityAdapter({
  selectId: (post) => post.id,
  sortComparer: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
})

const initialState = postsAdapter.setAll(postsAdapter.getInitialState(), buildSeedPosts())

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postPublished: {
      reducer(state, action) {
        postsAdapter.addOne(state, action.payload)
      },
      prepare({ text, platformIds, mediaCount, length, hashtagCount }) {
        return {
          payload: {
            id: nanoid(),
            text,
            platformIds,
            mediaCount,
            length,
            hashtagCount,
            status: 'published',
            createdAt: new Date().toISOString()
          }
        }
      }
    },

    // A post placed on a future (or any chosen) calendar date instead of
    // being published immediately. Same shape as a published post, just a
    // different status and a caller-chosen date instead of "now".
    postScheduled: {
      reducer(state, action) {
        postsAdapter.addOne(state, action.payload)
      },
      prepare({ text, platformIds, mediaCount, length, hashtagCount, date }) {
        return {
          payload: {
            id: nanoid(),
            text,
            platformIds,
            mediaCount,
            length,
            hashtagCount,
            status: 'scheduled',
            createdAt: new Date(date).toISOString()
          }
        }
      }
    },

    // Drag-and-drop reschedule: moves an existing post to a different
    // calendar day by updating its createdAt date (time-of-day preserved).
    postRescheduled: {
      reducer(state, action) {
        const { id, newDate } = action.payload
        postsAdapter.updateOne(state, { id, changes: { createdAt: newDate } })
      },
      prepare(id, newDate) {
        return { payload: { id, newDate } }
      }
    }
  }
})

// Adapter-generated selectors, scoped to this slice's location in the
// store. Other selector files build on top of these instead of reaching
// into state.posts.entities/ids directly.
export const postsSelectors = postsAdapter.getSelectors((state) => state.posts)

export const { postPublished, postScheduled, postRescheduled } = postsSlice.actions
export default postsSlice.reducer
