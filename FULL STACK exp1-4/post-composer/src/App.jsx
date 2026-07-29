import { Suspense, lazy, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ComposerPanel from './components/ComposerPanel.jsx'
import PlatformSelector from './components/PlatformSelector.jsx'
import ConstraintMeter from './components/ConstraintMeter.jsx'
import ValidationLog from './components/ValidationLog.jsx'
import PreviewPanel from './components/PreviewPanel.jsx'
import TabNav from './components/TabNav.jsx'
import DraftsPanel from './components/DraftsPanel.jsx'
import FilterBar from './components/FilterBar.jsx'
import LoginPage from './components/LoginPage.jsx'
import AdminPanel from './components/AdminPanel.jsx'

import {
  setComposerText,
  toggleComposerPlatform,
  setComposerMedia,
  setPublishState,
  setEditingDraftId,
  setComposerToast,
  resetComposer,
  setActiveTab
} from './store/slices/uiSlice.js'
import { saveDraft } from './store/slices/draftsSlice.js'
import { postPublished } from './store/slices/postsSlice.js'
import { logout, restoreSession } from './store/slices/authSlice.js'
import {
  selectComposer,
  selectSelectedPlatforms,
  selectComposerValidation,
  selectCanPublish
} from './store/selectors/composerSelectors.js'
import { selectPlatformsById } from './store/selectors/platformsSelectors.js'
import { selectDraftsSavingStatus } from './store/selectors/draftsSelectors.js'
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectCurrentRole,
  selectSessionStartedAt,
  selectRestoreStatus
} from './store/selectors/authSelectors.js'
import { can, tabsForRole, ROLE_PERMISSIONS } from './utils/permissions.js'

// Lazy-loaded: these two views pull in more render work (grid + aggregation)
// than most users need on first load, so the chunk only downloads and
// mounts once someone actually clicks the Calendar or Analytics tab.
const CalendarView = lazy(() => import('./components/CalendarView.jsx'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard.jsx'))

function SuspenseFallback({ label }) {
  return <div className="suspense-fallback">Loading {label}…</div>
}

export default function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const restoreStatus = useSelector(selectRestoreStatus)

  // On first load, check for a previously-issued session token (Experiment
  // 5 — JWT auth) before deciding whether to show the login screen, so a
  // page refresh doesn't force signed-in users to log back in.
  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  if (restoreStatus === 'loading') {
    return <div className="suspense-fallback">Restoring session…</div>
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const role = useSelector(selectCurrentRole)
  const sessionStartedAt = useSelector(selectSessionStartedAt)
  const activeTab = useSelector((state) => state.ui.activeTab)
  const composer = useSelector(selectComposer)
  const platformsById = useSelector(selectPlatformsById)
  const selectedPlatforms = useSelector(selectSelectedPlatforms)
  const validationRows = useSelector(selectComposerValidation)
  const canPublishDraft = useSelector(selectCanPublish)
  const savingStatus = useSelector(selectDraftsSavingStatus)

  const allowedTabs = tabsForRole(role)
  const permissions = ROLE_PERMISSIONS[role]
  const canPublish = canPublishDraft && can(role, 'canPublish')
  const canSaveDraft = can(role, 'canSaveDraft')

  const readyCount = validationRows.filter((row) => row.result.status !== 'error').length

  // Guard against landing on a tab the current role can't see (e.g. an
  // admin viewing the Admin tab, then logging out and back in as viewer).
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      dispatch(setActiveTab('composer'))
    }
  }, [allowedTabs, activeTab, dispatch])

  useEffect(() => {
    if (!composer.toast) return
    const t = setTimeout(() => dispatch(setComposerToast(null)), 2200)
    return () => clearTimeout(t)
  }, [composer.toast, dispatch])

  const handleTextChange = useCallback((value) => dispatch(setComposerText(value)), [dispatch])
  const handleTogglePlatform = useCallback(
    (id) => dispatch(toggleComposerPlatform(id)),
    [dispatch]
  )
  const handleMediaChange = useCallback(
    (value) => dispatch(setComposerMedia(value)),
    [dispatch]
  )

  const handlePublish = () => {
    if (!canPublish) return
    const totalLength = Math.max(...validationRows.map((row) => row.result.length), 0)
    const totalHashtags = Math.max(...validationRows.map((row) => row.result.hashtagCount), 0)
    dispatch(
      postPublished({
        text: composer.text,
        platformIds: composer.selectedPlatformIds,
        mediaCount: composer.mediaCount,
        length: totalLength,
        hashtagCount: totalHashtags
      })
    )
    dispatch(setPublishState('published'))
    dispatch(setComposerToast('Published to ' + selectedPlatforms.length + ' platform(s).'))
    setTimeout(() => dispatch(setPublishState('idle')), 2500)
  }

  const handleSaveDraft = async () => {
    if (!canSaveDraft) return
    const draft = {
      id: composer.editingDraftId,
      text: composer.text,
      platformIds: composer.selectedPlatformIds,
      mediaCount: composer.mediaCount
    }
    const action = await dispatch(saveDraft(draft))
    if (saveDraft.fulfilled.match(action)) {
      dispatch(setEditingDraftId(action.payload.id))
      dispatch(setComposerToast('Draft saved.'))
    } else {
      dispatch(setComposerToast('Could not save draft.'))
    }
  }

  return (
    <div className="app-shell">
      <header className="console-header">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div className="brand-text">
            <div className="title">Broadcast Composer</div>
            <div className="subtitle">Experiments 1–4 — composer, Redux, drafts &amp; role-based access</div>
          </div>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span className={`role-badge role-${role}`}>{permissions.label}</span>
            <span className="user-name">{user.name}</span>
            {sessionStartedAt && (
              <span className="user-since">
                signed in{' '}
                {new Date(sessionStartedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
          {canSaveDraft && (
            <button
              type="button"
              className="ghost-btn"
              onClick={handleSaveDraft}
              disabled={savingStatus === 'loading'}
            >
              {savingStatus === 'loading'
                ? 'Saving…'
                : composer.editingDraftId
                ? 'Update draft'
                : 'Save draft'}
            </button>
          )}
          {can(role, 'canPublish') && (
            <button
              type="button"
              className={`publish-btn${composer.publishState === 'published' ? ' published' : ''}`}
              disabled={!canPublish}
              onClick={handlePublish}
            >
              {composer.publishState === 'published' ? '✓ Published' : 'Publish'}
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => dispatch(logout())}>
            Log out
          </button>
        </div>
      </header>

      <TabNav allowedTabs={allowedTabs} />

      {activeTab === 'composer' && (
        <div className="console-grid">
          <PlatformSelector
            selected={composer.selectedPlatformIds}
            onToggle={handleTogglePlatform}
          />

          <div>
            {!permissions.canPublish && (
              <div className="log-line" style={{ marginBottom: 12 }}>
                <span className="log-tag warn">[VIEW]</span>
                <span>
                  Your role ({permissions.label}) has read-only access to the composer.
                  Publishing and saving drafts are disabled.
                </span>
              </div>
            )}

            {composer.editingDraftId && (
              <div className="log-line" style={{ marginBottom: 12 }}>
                <span className="log-tag warn">[EDIT]</span>
                <span>
                  Editing a saved draft.{' '}
                  <button
                    type="button"
                    className="ghost-btn"
                    style={{ marginLeft: 6, padding: '2px 8px' }}
                    onClick={() => dispatch(resetComposer())}
                  >
                    Start new post
                  </button>
                </span>
              </div>
            )}

            <ComposerPanel
              text={composer.text}
              onChange={handleTextChange}
              mediaCount={composer.mediaCount}
              onMediaChange={handleMediaChange}
            />

            <div className="panel section-gap">
              <div className="panel-label">Constraint meters</div>
              {selectedPlatforms.length === 0 ? (
                <div className="empty-state">
                  Pick at least one platform to see live constraint tracking.
                </div>
              ) : (
                validationRows.map(({ platform, result }) => (
                  <ConstraintMeter key={platform.id} platform={platform} result={result} />
                ))
              )}
            </div>

            <ValidationLog
              results={validationRows.map((row) => row.result)}
              platformsById={platformsById}
            />
          </div>

          <PreviewPanel platforms={selectedPlatforms} text={composer.text} />
        </div>
      )}

      {activeTab === 'drafts' && (
        <DraftsPanel
          canEdit={can(role, 'canEditDraft')}
          canDelete={can(role, 'canDeleteDraft')}
        />
      )}

      {activeTab === 'calendar' && (
        <Suspense fallback={<SuspenseFallback label="calendar" />}>
          <FilterBar />
          <CalendarView canSchedule={can(role, 'canPublish')} />
        </Suspense>
      )}

      {activeTab === 'analytics' && (
        <Suspense fallback={<SuspenseFallback label="analytics" />}>
          <FilterBar />
          <AnalyticsDashboard />
        </Suspense>
      )}

      {activeTab === 'admin' && role === 'admin' && <AdminPanel />}

      {composer.toast && <div className="toast">{composer.toast}</div>}
    </div>
  )
}
