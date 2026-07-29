import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginApi, getLoginHistoryApi } from '../../mockApi/authApi.js'
import { verifyToken } from '../../utils/jwt.js'

// Session storage (not localStorage) so the token — and thus the
// session — disappears when the tab closes, the way a short-lived JWT
// session commonly behaves, while still surviving a page refresh.
const TOKEN_STORAGE_KEY = 'pc_auth_token'

function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null // storage unavailable (e.g. private browsing) — fail closed
  }
}

function writeStoredToken(token) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* non-fatal: session just won't survive a refresh */
  }
}

function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* nothing to do */
  }
}

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
  const { user, token } = await loginApi(username, password)
  // Store the token, not the credentials — every future "authenticated"
  // mock-API call attaches this instead of re-sending a password.
  writeStoredToken(token)
  return { user, token }
})

// Runs once on app load: look for a previously-issued token, verify its
// signature and expiry client-side, and — if it's still good — restore
// the session without hitting the login form again. This is what makes
// the auth "stateless" from the server's point of view: the token alone
// carries everything needed to know who's signed in.
export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    const token = readStoredToken()
    if (!token) return rejectWithValue('No stored session.')

    const payload = verifyToken(token)
    if (!payload) {
      clearStoredToken()
      return rejectWithValue('Session expired or invalid.')
    }

    return {
      token,
      payload,
      user: {
        id: payload.sub,
        username: payload.username,
        name: payload.name,
        role: payload.role
      }
    }
  }
)

// A second, independent async flow against the same mock backend: fetching
// the login audit log. Kept separate from `login` so the history panel can
// show its own loading state without interfering with the login form.
export const fetchLoginHistory = createAsyncThunk(
  'auth/fetchHistory',
  async (_, { getState }) => {
    const { token } = getState().auth
    const history = await getLoginHistoryApi(token)
    return history
  }
)

const initialState = {
  user: null, // { id, username, name, role }
  token: null, // signed, expiring session token (see utils/jwt.js)
  sessionStartedAt: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  restoreStatus: 'loading', // loading | done — gates the initial render so we
  // don't flash the login screen before checking for a stored session
  history: [],
  historyStatus: 'idle'
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.sessionStartedAt = null
      state.status = 'idle'
      state.error = null
      clearStoredToken()
    },
    clearAuthError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        state.sessionStartedAt = new Date().toISOString()
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })

      .addCase(restoreSession.pending, (state) => {
        state.restoreStatus = 'loading'
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.restoreStatus = 'done'
        state.status = 'succeeded'
        state.user = action.payload.user
        state.token = action.payload.token
        // Preserve the *original* sign-in time from the token's `iat`
        // claim, not the moment the session was restored.
        state.sessionStartedAt = new Date(action.payload.payload.iat * 1000).toISOString()
      })
      .addCase(restoreSession.rejected, (state) => {
        state.restoreStatus = 'done'
      })

      .addCase(fetchLoginHistory.pending, (state) => {
        state.historyStatus = 'loading'
      })
      .addCase(fetchLoginHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload
      })
      .addCase(fetchLoginHistory.rejected, (state) => {
        state.historyStatus = 'failed'
      })
  }
})

export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
