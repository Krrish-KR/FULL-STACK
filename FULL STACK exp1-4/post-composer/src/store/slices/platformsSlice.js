import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { PLATFORMS } from '../../data/platforms.js'

// Platforms are static reference data, but they're still stored in Redux
// (via the same adapter pattern as posts/drafts) so every slice that
// references a platform by id reads from one shared, normalized source
// instead of re-importing the raw config array directly.
const platformsAdapter = createEntityAdapter({ selectId: (p) => p.id })

const initialState = platformsAdapter.setAll(platformsAdapter.getInitialState(), PLATFORMS)

const platformsSlice = createSlice({
  name: 'platforms',
  initialState,
  reducers: {}
})

export const platformsSelectors = platformsAdapter.getSelectors((state) => state.platforms)

export default platformsSlice.reducer
