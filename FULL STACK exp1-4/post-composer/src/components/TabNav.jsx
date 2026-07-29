import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab } from '../store/slices/uiSlice.js'

const ALL_TABS = [
  { id: 'composer', label: 'Composer' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'admin', label: 'Admin' }
]

export default function TabNav({ allowedTabs }) {
  const dispatch = useDispatch()
  const activeTab = useSelector((state) => state.ui.activeTab)
  const tabs = ALL_TABS.filter((tab) => allowedTabs.includes(tab.id))

  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => dispatch(setActiveTab(tab.id))}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
