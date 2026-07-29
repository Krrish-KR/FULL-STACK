import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDrafts, deleteDraft } from '../store/slices/draftsSlice.js'
import { loadDraftIntoComposer } from '../store/slices/uiSlice.js'
import {
  selectAllDrafts,
  selectDraftsStatus,
  selectDraftsError,
  selectDeletingDraftId
} from '../store/selectors/draftsSelectors.js'
import { selectPlatformsById } from '../store/selectors/platformsSelectors.js'
import DraftCard from './DraftCard.jsx'

export default function DraftsPanel({ canEdit, canDelete }) {
  const dispatch = useDispatch()
  const drafts = useSelector(selectAllDrafts)
  const status = useSelector(selectDraftsStatus)
  const error = useSelector(selectDraftsError)
  const deletingId = useSelector(selectDeletingDraftId)
  const platformsById = useSelector(selectPlatformsById)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchDrafts())
  }, [status, dispatch])

  // useCallback keeps these handler references stable across re-renders so
  // memoized <DraftCard> instances don't re-render just because the parent did.
  const handleEdit = useCallback(
    (draft) => dispatch(loadDraftIntoComposer(draft)),
    [dispatch]
  )
  const handleDelete = useCallback((id) => dispatch(deleteDraft(id)), [dispatch])

  return (
    <div className="panel">
      <div className="panel-label">Saved drafts</div>

      {status === 'loading' && (
        <div className="log-empty">[…] fetching drafts from server…</div>
      )}

      {status === 'failed' && (
        <div className="log-line" style={{ marginBottom: 10 }}>
          <span className="log-tag err">[ERR]</span>
          <span>{error || 'Could not load drafts.'}</span>
        </div>
      )}

      {status === 'succeeded' && drafts.length === 0 && (
        <div className="empty-state">
          No drafts yet. Save one from the Composer tab.
        </div>
      )}

      <div className="draft-list">
        {drafts.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            platformsById={platformsById}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deletingId === draft.id}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  )
}
