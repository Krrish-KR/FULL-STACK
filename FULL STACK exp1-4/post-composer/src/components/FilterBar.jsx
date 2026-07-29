import { useDispatch, useSelector } from 'react-redux'
import { setFilterSearch, setFilterPlatform, setFilterStatus } from '../store/slices/uiSlice.js'
import { selectAllPlatforms } from '../store/selectors/platformsSelectors.js'

export default function FilterBar() {
  const dispatch = useDispatch()
  const filters = useSelector((state) => state.ui.filters)
  const platforms = useSelector(selectAllPlatforms)

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-input"
        placeholder="Search post text…"
        value={filters.search}
        onChange={(e) => dispatch(setFilterSearch(e.target.value))}
      />
      <select
        className="filter-select"
        value={filters.platformId}
        onChange={(e) => dispatch(setFilterPlatform(e.target.value))}
      >
        <option value="all">All platforms</option>
        {platforms.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        className="filter-select"
        value={filters.status}
        onChange={(e) => dispatch(setFilterStatus(e.target.value))}
      >
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="scheduled">Scheduled</option>
      </select>
    </div>
  )
}
