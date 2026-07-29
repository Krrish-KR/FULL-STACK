import { platformsSelectors } from '../slices/platformsSlice.js'

// Thin re-exports so the rest of the app depends on a stable selector
// name (`selectAllPlatforms`) rather than on the adapter's internal
// naming, and so a future switch away from createEntityAdapter would only
// touch this one file.
export const selectAllPlatforms = platformsSelectors.selectAll
export const selectPlatformsById = platformsSelectors.selectEntities
