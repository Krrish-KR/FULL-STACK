import { memo } from 'react'
import EntityCard from './EntityCard.jsx'
import { extractTokens } from '../utils/validate.js'

function DraftCard({ draft, platformsById, onEdit, onDelete, isDeleting, canEdit, canDelete }) {
  const { hashtags } = extractTokens(draft.text || '')
  const showActions = canEdit || canDelete

  const actions = showActions ? (
    <>
      {canEdit && (
        <button type="button" className="ghost-btn" onClick={() => onEdit(draft)}>
          Edit
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          className="ghost-btn danger"
          onClick={() => onDelete(draft.id)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      )}
    </>
  ) : null

  return (
    <EntityCard
      id={draft.id}
      text={draft.text}
      platformIds={draft.platformIds}
      platformsById={platformsById}
      timestamp={draft.updatedAt}
      statusLabel="Draft"
      statusVariant="draft"
      mediaCount={draft.mediaCount}
      hashtagCount={hashtags.length}
      actions={actions}
    />
  )
}

export default memo(DraftCard)
