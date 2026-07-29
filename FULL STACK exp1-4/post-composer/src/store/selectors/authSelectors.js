import { createSelector } from '@reduxjs/toolkit'

export const selectAuthState = (state) => state.auth
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => Boolean(state.auth.user)
export const selectAuthStatus = (state) => state.auth.status
export const selectAuthError = (state) => state.auth.error
export const selectAuthToken = (state) => state.auth.token
export const selectRestoreStatus = (state) => state.auth.restoreStatus

export const selectCurrentRole = createSelector(
  selectCurrentUser,
  (user) => user?.role ?? null
)

export const selectSessionStartedAt = (state) => state.auth.sessionStartedAt
export const selectLoginHistory = (state) => state.auth.history
export const selectLoginHistoryStatus = (state) => state.auth.historyStatus
