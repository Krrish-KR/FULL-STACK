import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearAuthError } from '../store/slices/authSlice.js'
import { selectAuthStatus, selectAuthError } from '../store/selectors/authSelectors.js'

const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin', password: 'admin123' },
  { role: 'Editor', username: 'editor', password: 'editor123' },
  { role: 'Viewer', username: 'viewer', password: 'viewer123' }
]

export default function LoginPage() {
  const dispatch = useDispatch()
  const status = useSelector(selectAuthStatus)
  const error = useSelector(selectAuthError)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    dispatch(login({ username, password }))
  }

  const fillDemo = (account) => {
    setUsername(account.username)
    setPassword(account.password)
    dispatch(clearAuthError())
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="brand-mark">B</div>
          <div className="brand-text">
            <div className="title">Broadcast Composer</div>
            <div className="subtitle">Sign in to continue</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="login-input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. editor"
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {status === 'failed' && error && (
            <div className="log-line" style={{ margin: '12px 0 0' }}>
              <span className="log-tag err">[ERR]</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="publish-btn"
            style={{ width: '100%', marginTop: 18, padding: '11px 18px' }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <div className="panel-label">Demo accounts (role-based access)</div>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              type="button"
              key={account.username}
              className="ghost-btn login-demo-btn"
              onClick={() => fillDemo(account)}
            >
              <span>{account.role}</span>
              <span className="login-demo-creds">
                {account.username} / {account.password}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
