import { draftsSelectors } from '../slices/draftsSlice.js'

export const selectAllDrafts = draftsSelectors.selectAll
export const selectDraftById = draftsSelectors.selectById

export const selectDraftsStatus = (state) => state.drafts.status
export const selectDraftsSavingStatus = (state) => state.drafts.savingStatus
export const selectDraftsError = (state) => state.drafts.error
export const selectDeletingDraftId = (state) => state.drafts.deletingId
