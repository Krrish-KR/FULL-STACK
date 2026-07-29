import { memo } from 'react'

// Pulled out of CalendarView and wrapped in memo() specifically so that
// dragging over one cell (which changes CalendarView's dragOverKey state
// and re-renders the whole grid) doesn't force all ~30 other day cells to
// re-render too - only the cell(s) whose own props actually changed do.
function CalendarDay({
  dayKey,
  day,
  count,
  dotAccents,
  hasScheduled,
  isSelected,
  isToday,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop
}) {
  return (
    <button
      type="button"
      data-key={dayKey}
      className={`calendar-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${
        isDragOver ? ' drag-over' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="cell-day">{day}</span>
      {dotAccents.length > 0 && (
        <span className="cell-dots">
          {dotAccents.map((accent, i) => (
            <span
              key={i}
              className={`cell-dot${hasScheduled ? ' cell-dot-scheduled' : ''}`}
              style={{ background: accent }}
            />
          ))}
        </span>
      )}
      {count > 0 && <span className="cell-badge">{count}</span>}
    </button>
  )
}

export default memo(CalendarDay)
