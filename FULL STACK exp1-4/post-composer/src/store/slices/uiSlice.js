import { createSlice } from '@reduxjs/toolkit'

// Splitting "what the user is doing right now" (this slice) from
// "the data" (posts/drafts/platforms slices) means typing in the composer
// only ever updates this small slice - components subscribed to posts or
// drafts don't re-render on every keystroke.

const initialState = {
  activeTab: 'composer', // composer | drafts | calendar | analytics
  composer: {
    text: 'Excited to launch our new feature today! #ProductLaunch #BuildInPublic',
    selectedPlatformIds: ['x', 'instagram'],
    mediaCount: 1,
    editingDraftId: null,
    publishState: 'idle', // idle | published
    toast: null
  },
  filters: {
    search: '',
    platformId: 'all',
    status: 'all'
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload
    },
    setComposerText(state, action) {
      state.composer.text = action.payload
      state.composer.publishState = 'idle'
    },
    toggleComposerPlatform(state, action) {
      const id = action.payload
      const ids = state.composer.selectedPlatformIds
      state.composer.selectedPlatformIds = ids.includes(id)
        ? ids.filter((p) => p !== id)
        : [...ids, id]
      state.composer.publishState = 'idle'
    },
    setComposerMedia(state, action) {
      state.composer.mediaCount = action.payload
      state.composer.publishState = 'idle'
    },
    loadDraftIntoComposer(state, action) {
      const draft = action.payload
      state.composer.text = draft.text
      state.composer.selectedPlatformIds = draft.platformIds
      state.composer.mediaCount = draft.mediaCount
      state.composer.editingDraftId = draft.id
      state.composer.publishState = 'idle'
      state.activeTab = 'composer'
    },
    resetComposer(state) {
      state.composer.text = ''
      state.composer.selectedPlatformIds = []
      state.composer.mediaCount = 0
      state.composer.editingDraftId = null
      state.composer.publishState = 'idle'
    },
    setPublishState(state, action) {
      state.composer.publishState = action.payload
    },
    setEditingDraftId(state, action) {
      state.composer.editingDraftId = action.payload
    },
    setComposerToast(state, action) {
      state.composer.toast = action.payload
    },
    setFilterSearch(state, action) {
      state.filters.search = action.payload
    },
    setFilterPlatform(state, action) {
      state.filters.platformId = action.payload
    },
    setFilterStatus(state, action) {
      state.filters.status = action.payload
    }
  }
})

export const {
  setActiveTab,
  setComposerText,
  toggleComposerPlatform,
  setComposerMedia,
  loadDraftIntoComposer,
  resetComposer,
  setPublishState,
  setEditingDraftId,
  setComposerToast,
  setFilterSearch,
  setFilterPlatform,
  setFilterStatus
} = uiSlice.actions

export default uiSlice.reducer
