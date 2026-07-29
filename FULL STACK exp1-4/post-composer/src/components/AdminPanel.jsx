import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { listUsersApi } from '../mockApi/authApi.js'
import { ROLE_PERMISSIONS } from '../utils/permissions.js'
import { selectAllDrafts } from '../store/selectors/draftsSelectors.js'
import { selectAllPosts } from '../store/selectors/postsSelectors.js'
import { fetchLoginHistory } from '../store/slices/authSlice.js'
import {
  selectLoginHistory,
  selectLoginHistoryStatus,
  selectCurrentUser
} from '../store/selectors/authSelectors.js'

function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  })
}

export default function AdminPanel() {
  const dispatch = useDispatch()
  const users = useMemo(() => listUsersApi(), [])
  const drafts = useSelector(selectAllDrafts)
  const posts = useSelector(selectAllPosts)
  const history = useSelector(selectLoginHistory)
  const historyStatus = useSelector(selectLoginHistoryStatus)
  const currentUser = useSelector(selectCurrentUser)

  useEffect(() => {
    dispatch(fetchLoginHistory())
  }, [dispatch])

  return (
    <>
      <div className="panel">
        <div className="panel-label">Admin — user directory</div>
        <p className="rack-hint" style={{ marginBottom: 14 }}>
          Visible only to the <strong>admin</strong> role. Editors and viewers
          never see this tab — it's filtered out of the nav entirely, not just
          hidden with CSS.
        </p>

        <div className="admin-table">
          <div className="admin-row admin-head">
            <span>Name</span>
            <span>Username</span>
            <span>Role</span>
            <span>Permissions</span>
          </div>
          {users.map((user) => {
            const perms = ROLE_PERMISSIONS[user.role]
            return (
              <div className="admin-row" key={user.id}>
                <span>{user.name}</span>
                <span className="mono-cell">{user.username}</span>
                <span>
                  <span className={`role-badge role-${user.role}`}>{perms.label}</span>
                </span>
                <span className="mono-cell">
                  {perms.canPublish ? 'publish · ' : ''}
                  {perms.canSaveDraft ? 'save · ' : ''}
                  {perms.canDeleteDraft ? 'delete' : 'read-only'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="stat-grid section-gap">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{drafts.length}</div>
            <div className="stat-label">Total drafts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{posts.length}</div>
            <div className="stat-label">Total posts</div>
          </div>
        </div>
      </div>

      <div className="panel section-gap">
        <div className="panel-label">Login history</div>
        <p className="rack-hint" style={{ marginBottom: 14 }}>
          Every sign-in attempt against the mock auth backend — successful or
          not — with who, when, and which role. Newest first.
        </p>

        {historyStatus === 'loading' && (
          <div className="log-empty">[…] fetching login history…</div>
        )}

        {historyStatus === 'succeeded' && history.length === 0 && (
          <div className="empty-state">No login attempts recorded yet.</div>
        )}

        {history.length > 0 && (
          <div className="admin-table">
            <div className="admin-row admin-row-history admin-head">
              <span>When</span>
              <span>User</span>
              <span>Role</span>
              <span>Result</span>
            </div>
            {history.map((entry) => (
              <div className="admin-row admin-row-history" key={entry.id}>
                <span className="mono-cell">{formatWhen(entry.at)}</span>
                <span>
                  {entry.name}
                  {currentUser && entry.username === currentUser.username && (
                    <span className="you-tag">you</span>
                  )}
                </span>
                <span>
                  {entry.role ? (
                    <span className={`role-badge role-${entry.role}`}>
                      {ROLE_PERMISSIONS[entry.role]?.label ?? entry.role}
                    </span>
                  ) : (
                    <span className="mono-cell">—</span>
                  )}
                </span>
                <span>
                  <span
                    className={`entity-status entity-status-${
                      entry.success ? 'published' : 'failed'
                    }`}
                  >
                    {entry.success ? 'Success' : 'Failed'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
