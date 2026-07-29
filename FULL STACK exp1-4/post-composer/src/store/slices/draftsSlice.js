import { createSlice, createEntityAdapter, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchDraftsApi, saveDraftApi, deleteDraftApi } from '../../mockApi/draftsApi.js'

// Async workflow: each thunk represents one round trip to the (mock)
// backend. Components dispatch these and read `status`/`error` to render
// loading and failure states instead of guessing.

export const fetchDrafts = createAsyncThunk('drafts/fetch', async (_, { getState }) => {
  const { token } = getState().auth
  const drafts = await fetchDraftsApi(token)
  return drafts
})

export const saveDraft = createAsyncThunk('drafts/save', async (draft, { getState }) => {
  const { token } = getState().auth
  const saved = await saveDraftApi(draft, token)
  return saved
})

export const deleteDraft = createAsyncThunk('drafts/delete', async (id, { getState }) => {
  const { token } = getState().auth
  await deleteDraftApi(id, token)
  return id
})

const draftsAdapter = createEntityAdapter({
  selectId: (draft) => draft.id,
  sortComparer: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
})

const initialState = draftsAdapter.getInitialState({
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  savingStatus: 'idle',
  deletingId: null
})

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrafts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        draftsAdapter.setAll(state, action.payload)
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })

      .addCase(saveDraft.pending, (state) => {
        state.savingStatus = 'loading'
      })
      .addCase(saveDraft.fulfilled, (state, action) => {
        state.savingStatus = 'succeeded'
        draftsAdapter.upsertOne(state, action.payload)
      })
      .addCase(saveDraft.rejected, (state, action) => {
        state.savingStatus = 'failed'
        state.error = action.error.message
      })

      .addCase(deleteDraft.pending, (state, action) => {
        state.deletingId = action.meta.arg
      })
      .addCase(deleteDraft.fulfilled, (state, action) => {
        draftsAdapter.removeOne(state, action.payload)
        state.deletingId = null
      })
      .addCase(deleteDraft.rejected, (state, action) => {
        state.deletingId = null
        state.error = action.error.message
      })
  }
})

export const draftsSelectors = draftsAdapter.getSelectors((state) => state.drafts)
export default draftsSlice.reducer
