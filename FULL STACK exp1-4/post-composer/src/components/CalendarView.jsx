import { useMemo, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCalendarEvents, selectAllPosts } from '../store/selectors/postsSelectors.js'
import { selectPlatformsById, selectAllPlatforms } from '../store/selectors/platformsSelectors.js'
import { postScheduled, postRescheduled } from '../store/slices/postsSlice.js'
import { extractTokens } from '../utils/validate.js'
import EntityCard from './EntityCard.jsx'
import CalendarDay from './CalendarDay.jsx'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function toKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// Moves a date to a new day while keeping its original time-of-day, so
// dragging a 9:15am post from the 3rd to the 10th keeps it at 9:15am.
function withNewDateKeepingTime(originalIso, dayKey) {
  const original = new Date(originalIso)
  const [y, m, d] = dayKey.split('-').map(Number)
  const updated = new Date(original)
  updated.setFullYear(y, m - 1, d)
  return updated.toISOString()
}

export default function CalendarView({ canSchedule }) {
  const dispatch = useDispatch()
  const eventsByDate = useSelector(selectCalendarEvents)
  const platformsById = useSelector(selectPlatformsById)
  const allPlatforms = useSelector(selectAllPlatforms)
  const allPosts = useSelector(selectAllPosts)
  const postsById = useMemo(() => Object.fromEntries(allPosts.map((p) => [p.id, p])), [allPosts])

  const today = new Date()
  const [year] = useState(today.getFullYear())
  const [month] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState(toKey(year, month, today.getDate()))
  const [dragOverKey, setDragOverKey] = useState(null)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [quickPlatformIds, setQuickPlatformIds] = useState([])

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [year, month]
  )
  const selectedPosts = eventsByDate[selectedKey] || []
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  // Single handler shared by every cell (event delegation via a click on
  // the grid container reading the clicked cell's data-key), instead of a
  // fresh onClick closure allocated per cell on every render.
  const handleGridClick = useCallback((e) => {
    const cell = e.target.closest('[data-key]')
    if (!cell) return
    setSelectedKey(cell.dataset.key)
  }, [])

  const handleDragStart = useCallback((e, postId) => {
    e.dataTransfer.setData('text/plain', postId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback(
    (e, dayKey) => {
      e.preventDefault()
      setDragOverKey(null)
      const postId = e.dataTransfer.getData('text/plain')
      const original = postsById[postId]
      if (!original || original.status !== 'scheduled') return
      const currentKey = original.createdAt.slice(0, 10)
      if (currentKey === dayKey) return
      dispatch(postRescheduled(postId, withNewDateKeepingTime(original.createdAt, dayKey)))
    },
    [postsById, dispatch]
  )

  const toggleQuickPlatform = (id) => {
    setQuickPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleQuickSchedule = () => {
    if (!quickText.trim() || quickPlatformIds.length === 0) return
    const { hashtags } = extractTokens(quickText)
    dispatch(
      postScheduled({
        text: quickText,
        platformIds: quickPlatformIds,
        mediaCount: 0,
        length: [...quickText].length,
        hashtagCount: hashtags.length,
        date: `${selectedKey}T09:00:00`
      })
    )
    setQuickText('')
    setQuickPlatformIds([])
    setShowQuickForm(false)
  }

  return (
    <div className="panel">
      <div className="panel-label">Calendar — {monthLabel}</div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid" onClick={handleGridClick}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-cell empty" />
          const key = toKey(year, month, day)
          const dayPosts = eventsByDate[key] || []
          const uniquePlatformIds = [...new Set(dayPosts.flatMap((p) => p.platformIds))].slice(0, 3)
          const hasScheduled = dayPosts.some((p) => p.status === 'scheduled')

          return (
            <CalendarDay
              key={i}
              dayKey={key}
              day={day}
              count={dayPosts.length}
              dotAccents={uniquePlatformIds.map((pid) => platformsById[pid]?.accent)}
              hasScheduled={hasScheduled}
              isSelected={key === selectedKey}
              isToday={key === todayKey}
              isDragOver={dragOverKey === key}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverKey(key)
              }}
              onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
              onDrop={(e) => handleDrop(e, key)}
            />
          )
        })}
      </div>

      <div className="panel-label section-gap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Posts on {selectedKey} ({selectedPosts.length})
        </span>
        {canSchedule && (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowQuickForm((v) => !v)}
          >
            {showQuickForm ? 'Cancel' : '+ Schedule for this day'}
          </button>
        )}
      </div>

      {showQuickForm && (
        <div className="quick-schedule">
          <textarea
            className="composer-textarea quick-schedule-textarea"
            placeholder="What do you want to schedule for this day?"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
          />
          <div className="quick-schedule-platforms">
            {allPlatforms.map((platform) => (
              <button
                type="button"
                key={platform.id}
                className={`ghost-btn${quickPlatformIds.includes(platform.id) ? ' active-chip' : ''}`}
                style={{ '--platform-accent': platform.accent }}
                onClick={() => toggleQuickPlatform(platform.id)}
              >
                {platform.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="publish-btn"
            disabled={!quickText.trim() || quickPlatformIds.length === 0}
            onClick={handleQuickSchedule}
          >
            Add to {selectedKey}
          </button>
        </div>
      )}

      {selectedPosts.length === 0 ? (
        <div className="empty-state">No posts on this day.</div>
      ) : (
        <div className="draft-list">
          {selectedPosts.map((post) => (
            <EntityCard
              key={post.id}
              id={post.id}
              text={post.text}
              platformIds={post.platformIds}
              platformsById={platformsById}
              timestamp={post.createdAt}
              statusLabel={post.status === 'scheduled' ? 'Scheduled' : 'Published'}
              statusVariant={post.status === 'scheduled' ? 'scheduled' : 'published'}
              mediaCount={post.mediaCount}
              length={post.length}
              hashtagCount={post.hashtagCount}
              draggable={canSchedule && post.status === 'scheduled'}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
