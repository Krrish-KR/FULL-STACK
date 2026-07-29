import { createSelector } from '@reduxjs/toolkit'
import { validatePost } from '../../utils/validate.js'
import { selectPlatformsById } from './platformsSelectors.js'

export const selectComposer = (state) => state.ui.composer

export const selectSelectedPlatforms = createSelector(
  [selectComposer, selectPlatformsById],
  (composer, byId) => composer.selectedPlatformIds.map((id) => byId[id]).filter(Boolean)
)

// This is the selector this experiment is really about: it depends on
// three pieces of state (text, selected platforms, media count). Without
// memoization every keystroke would re-run validatePost() for every
// platform on every connected component. With createSelector, it only
// recomputes when one of those three inputs actually changes, and every
// component that calls useSelector(selectComposerValidation) shares the
// same cached result within a render pass.
export const selectComposerValidation = createSelector(
  [selectComposer, selectSelectedPlatforms],
  (composer, platforms) =>
    platforms.map((platform) => ({
      platform,
      result: validatePost(composer.text, platform, composer.mediaCount)
    }))
)

export const selectCanPublish = createSelector(
  selectComposerValidation,
  (rows) => rows.length > 0 && rows.every((row) => row.result.errors.length === 0)
)
