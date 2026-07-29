import { configureStore } from '@reduxjs/toolkit'
import platformsReducer from './slices/platformsSlice.js'
import postsReducer from './slices/postsSlice.js'
import draftsReducer from './slices/draftsSlice.js'
import uiReducer from './slices/uiSlice.js'
import authReducer from './slices/authSlice.js'

export const store = configureStore({
  reducer: {
    platforms: platformsReducer,
    posts: postsReducer,
    drafts: draftsReducer,
    ui: uiReducer,
    auth: authReducer
  }
})
