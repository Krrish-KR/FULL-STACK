import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarDay from '../../components/CalendarDay.jsx'

function renderDay(overrides = {}) {
  const props = {
    dayKey: '2030-01-15',
    day: 15,
    count: 2,
    dotAccents: ['#1D9BF0', '#E1306C'],
    hasScheduled: false,
    isSelected: false,
    isToday: false,
    isDragOver: false,
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    ...overrides
  }
  render(<CalendarDay {...props} />)
  return props
}

describe('<CalendarDay />', () => {
  it('renders the day number and post count badge', () => {
    renderDay()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not render a count badge when there are no posts', () => {
    renderDay({ count: 0, dotAccents: [] })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('applies the "selected" and "today" classes based on props', () => {
    const { container } = render(
      <CalendarDay
        dayKey="2030-01-15"
        day={15}
        count={0}
        dotAccents={[]}
        hasScheduled={false}
        isSelected
        isToday
        isDragOver={false}
        onDragOver={() => {}}
        onDragLeave={() => {}}
        onDrop={() => {}}
      />
    )
    const cell = container.querySelector('.calendar-cell')
    expect(cell.className).toContain('selected')
    expect(cell.className).toContain('today')
  })

  it('calls onDrop when a dragged item is dropped on the cell', () => {
    const onDrop = vi.fn()
    renderDay({ onDrop })
    const cell = screen.getByText('15').closest('button')
    fireEvent.drop(cell)
    expect(onDrop).toHaveBeenCalledTimes(1)
  })

  it('exposes the day key as a data attribute for event-delegated clicks', () => {
    renderDay({ dayKey: '2030-03-09', day: 9 })
    const cell = screen.getByText('9').closest('button')
    expect(cell).toHaveAttribute('data-key', '2030-03-09')
  })
})
