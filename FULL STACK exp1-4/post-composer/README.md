# Experiments 1–6 — Multi-Platform Post Composer

A single React app combining six linked experiments:

1. **Composer & validation** — dynamic multi-platform post composer with
   real-time constraint checking (character limits, hashtags, mentions,
   media count).
2. **Redux Toolkit state management** — centralized, normalized state for
   platforms, posts, and drafts, with async thunks simulating backend calls.
3. **Draft management + performance** — full CRUD for drafts against a mock
   API, memoized `createSelector` selectors for filtering/calendar/analytics,
   `React.memo`, and `React.lazy` code-splitting.
4. **JWT auth & role-based access control** — a login screen gates the
   whole app; a simulated signed token is issued on login, stored,
   attached to every protected mock-API call, and used to restore the
   session on refresh. Three demo roles (`admin`, `editor`, `viewer`) see
   different tabs and different permissions inside the composer and
   drafts list.
5. **Interactive calendar & scheduling** — a month-grid calendar for
   scheduling future posts and rescheduling them with native drag-and-drop.
6. **Rendering performance & testing** — event delegation and
   `React.memo` on the calendar grid, plus a Vitest + React Testing Library
   suite covering both logic (selectors, reducers, validation) and
   components.

---

## 1. How to run

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). You'll land
on a login screen first — use one of the demo accounts (also shown on the
screen itself, click one to autofill):

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | `admin`  | `admin123` |
| Editor | `editor` | `editor123`|
| Viewer | `viewer` | `viewer123`|

```bash
npm run build      # production bundle
npm run preview    # serve the production build locally
npm test           # run the Vitest suite once
npm run test:watch # run Vitest in watch mode
```

> `preview-standalone.html` from Experiment 1 is still included, but it only
> shows the composer/validation UI (no Redux, drafts, calendar, analytics,
> or login/roles) since those now depend on Redux Toolkit and can't run
> from a single CDN-script file without a bundler. Use `npm run dev` to see
> the full app.

---

## 2. Project structure

```
post-composer/
├── src/
│   ├── main.jsx                    # wraps <App/> in <Provider store={store}>
│   ├── App.jsx                     # tab routing, composer wiring, publish/save-draft
│   ├── index.css
│   ├── data/
│   │   ├── platforms.js            # source-of-truth platform constraints
│   │   └── seedPosts.js            # deterministic sample posts for demo data
│   ├── utils/
│   │   ├── validate.js             # pure validation engine (Experiment 1)
│   │   ├── permissions.js          # role -> permission map (Experiment 4)
│   │   └── jwt.js                  # mock JWT create/decode/verify (Experiment 4)
│   ├── mockApi/
│   │   ├── draftsApi.js            # fake backend: fetch/save/delete with delay
│   │   └── authApi.js              # fake backend: login + user directory
│   ├── store/
│   │   ├── index.js                 # configureStore
│   │   ├── slices/
│   │   │   ├── platformsSlice.js    # normalized, static reference data
│   │   │   ├── postsSlice.js        # normalized published posts
│   │   │   ├── draftsSlice.js       # normalized drafts + async thunks (CRUD)
│   │   │   ├── uiSlice.js           # composer state + filters (split from data)
│   │   │   └── authSlice.js         # login/logout + async login thunk
│   │   └── selectors/
│   │       ├── platformsSelectors.js
│   │       ├── composerSelectors.js # memoized validation derivation
│   │       ├── postsSelectors.js    # memoized filter/calendar/analytics
│   │       ├── draftsSelectors.js
│   │       └── authSelectors.js
│   └── components/
│       ├── LoginPage.jsx            # gates the app; demo-account shortcuts
│       ├── PlatformIcon.jsx         # original per-platform glyph icons
│       ├── PlatformSelector.jsx
│       ├── ComposerPanel.jsx
│       ├── ConstraintMeter.jsx      # React.memo
│       ├── ValidationLog.jsx
│       ├── PreviewPanel.jsx
│       ├── TabNav.jsx               # filters tabs by role
│       ├── DraftsPanel.jsx          # dispatches fetchDrafts on mount
│       ├── DraftCard.jsx            # React.memo, action buttons role-gated
│       ├── FilterBar.jsx
│       ├── CalendarView.jsx         # React.lazy loaded; scheduling + drag/drop
│       ├── CalendarDay.jsx          # React.memo'd single day cell
│       ├── AnalyticsDashboard.jsx   # React.lazy loaded
│       └── AdminPanel.jsx           # admin-only user directory
└── package.json

test/ (src/test/) mirrors the app structure:
├── setup.js                        # jest-dom matchers for Vitest
├── utils/
│   ├── validate.test.js
│   ├── permissions.test.js
│   ├── visualId.test.js
│   └── jwt.test.js                 # token create/decode/verify, expiry, tamper detection
├── store/
│   ├── postsSlice.test.js          # reducer logic (publish/schedule/reschedule)
│   └── postsSelectors.test.js      # filter/calendar/analytics selectors
└── components/
    ├── ConstraintMeter.test.jsx
    └── CalendarDay.test.jsx
```

---

## 3. Experiment 2 — Redux Toolkit state management

**Global store** (`src/store/index.js`) has five slices:

| Slice        | Shape                                   | Purpose |
|--------------|------------------------------------------|---------|
| `platforms`  | `createEntityAdapter` (`{ ids, entities }`) | static, normalized reference data |
| `posts`      | `createEntityAdapter` (`{ ids, entities }`) | published posts (feeds Calendar/Analytics) |
| `drafts`     | `createEntityAdapter` + `status/error/savingStatus/deletingId` | draft CRUD + async status |
| `ui`         | `{ activeTab, composer, filters }`       | everything the user is doing *right now* |
| `auth`       | `{ user, sessionStartedAt, status, error, history, historyStatus }` | login session + audit log |

**Normalization**: `posts`, `drafts`, and `platforms` all use Redux
Toolkit's `createEntityAdapter`, the canonical normalized-state pattern —
each slice's state is `{ ids: [...], entities: { [id]: entity } }`, and the
adapter generates `getSelectors()` (`selectAll`, `selectById`,
`selectEntities`, ...) plus CRUD reducers (`addOne`, `upsertOne`,
`removeOne`, `setAll`) so no slice hand-rolls its own lookup-table
bookkeeping. `postsSlice`/`draftsSlice` also give the adapter a
`sortComparer` so `selectAll` always returns entities newest-first without
a separate sort step downstream.

**State splitting**: composer keystrokes only touch `ui.composer`. Typing in
the textarea never touches `posts` or `drafts`, so components subscribed to
those slices (e.g. the Analytics dashboard) don't re-render while you type.

**Async data flow**: `draftsSlice.js` defines three `createAsyncThunk`s
(`fetchDrafts`, `saveDraft`, `deleteDraft`) that call the mock API in
`mockApi/draftsApi.js`. Each thunk's `pending/fulfilled/rejected` lifecycle
drives `status`/`error` in the slice, which `DraftsPanel.jsx` reads to show
loading, error, and empty states. `authSlice.js` follows the same pattern
for `login` and `fetchLoginHistory`.

---

## 4. Experiment 3 — Draft management + performance

**CRUD operations**:
- Create/Update → `Save draft` / `Update draft` button in the header calls
  `saveDraft(thunk)`, which upserts against the mock API.
- Read → `DraftsPanel` dispatches `fetchDrafts()` once on mount.
- Delete → each `DraftCard` has a `Delete` button wired to `deleteDraft(id)`.
- Editing a draft loads it back into the composer (`loadDraftIntoComposer`)
  and switches to the Composer tab automatically.

**Memoized selectors (Reselect / `createSelector`)**:
- `selectComposerValidation` (`composerSelectors.js`) — re-runs
  `validatePost()` only when composer text, selected platforms, or media
  count actually change, and is shared by every component that reads it in
  the same render pass.
- `selectFilteredPosts`, `selectCalendarEvents`, `selectAnalytics`
  (`postsSelectors.js`) — filtering, calendar-day grouping, and dashboard
  aggregation are each computed once and cached until their inputs change.

**Avoiding unnecessary re-renders**:
- `ConstraintMeter` and `DraftCard` are wrapped in `React.memo` so a list of
  N platforms/drafts doesn't fully re-render on every keystroke or unrelated
  state change.
- Handlers passed into memoized children (`handleEdit`, `handleDelete`,
  `handleTextChange`, etc.) are wrapped in `useCallback` so their identity
  stays stable across renders.

**Lazy loading**: `CalendarView` and `AnalyticsDashboard` are loaded with
`React.lazy()` + `<Suspense>` in `App.jsx`, so their code only downloads and
mounts the first time a user opens the Calendar or Analytics tab.

---

## 5. Experiment 4 — Login, JWT sessions & role-based access control

**JWT-based authentication** (`src/utils/jwt.js`): a small, dependency-free
module that simulates real token-based auth end to end:
- `createToken(claims)` — builds a standard `header.payload.signature`
  token (base64url-encoded JSON header/payload + a hashed "signature"),
  stamping `iat`/`exp` automatically.
- `decodeToken(token)` — reads claims back out without checking anything,
  the way a client decodes a token it already trusts.
- `verifyToken(token)` — recomputes the signature and checks expiry;
  returns the payload only if both pass. This is what stands in for a
  backend validating a bearer token on a protected route.

`mockApi/authApi.js`'s `loginApi()` now returns `{ user, token }` instead
of just a user — the token is what a real backend would issue after
checking credentials. `mockApi/authApi.js` and `mockApi/draftsApi.js` both
gate their "endpoints" behind `assertValidToken(token, ...)`, so every
drafts CRUD call and the admin login-history fetch all require (and
verify) a token, simulating **attaching the token to each request**.
`getLoginHistoryApi` additionally requires the token's role claim to be
`admin` — a second, server-side enforcement of RBAC on top of the
UI-level checks below.

`authSlice.js` stores the token in `state.auth.token`, persists it to
`sessionStorage` on login, and clears it on logout — **token storage**.
A `restoreSession` thunk runs once on app load (wired into `App.jsx`): it
reads any stored token, calls `verifyToken()` on it, and — if it's still
valid — restores the session (including the *original* sign-in time from
the token's `iat` claim) without hitting the login form again. This is
what makes the session **stateless from the server's point of view**: the
token alone carries who's signed in, and a page refresh doesn't force a
re-login. An invalid or expired stored token is discarded and the login
screen shows as normal. See `src/test/utils/jwt.test.js` for round-trip,
expiry, and tamper-detection coverage of the token module.

**Login flow**: `LoginPage.jsx` is shown whenever `state.auth.user` is
`null` (after the initial `restoreSession` check resolves). Submitting the
form dispatches the `login` thunk (`authSlice.js`), which calls the mock
`loginApi()` (an artificial 500ms delay + credential check against three
hardcoded demo accounts) and stores the returned user (id, name, role —
never the password) and JWT in state.

**Role → permission mapping** lives in one place, `utils/permissions.js`:

| Role   | Publish | Save draft | Edit draft | Delete draft | Tabs visible |
|--------|:-------:|:----------:|:----------:|:-------------:|--------------|
| Viewer | ✗ | ✗ | ✗ | ✗ | Composer, Drafts, Calendar, Analytics |
| Editor | ✓ | ✓ | ✓ | ✓ | Composer, Drafts, Calendar, Analytics |
| Admin  | ✓ | ✓ | ✓ | ✓ | + Admin (user directory) |

Components never hardcode `if (role === 'admin')` — they call `can(role,
'canPublish')` or filter tabs with `tabsForRole(role)`, so adding a new
permission or role only means editing `permissions.js`.

**Enforcement is structural, not just visual**: the Admin tab is filtered
out of `TabNav` for non-admins (it never renders, not just hidden via CSS),
and `App.jsx` has a guard `useEffect` that redirects back to the Composer
tab if the current role can't see whatever tab was last active (relevant
after logging out and back in as a different role).

**Logout** (`logout()` in `authSlice.js`) clears the user and drops back to
the login screen; composer/draft/post state in the other slices is left
alone, since in a real app they'd belong to the backend, not the session.

**Unique post/draft styling**: every post and draft renders through one
shared `EntityCard` (`components/EntityCard.jsx`). Each card gets a
deterministic gradient avatar and initials derived from a hash of its id
(`utils/visualId.js`) — same entity always looks the same, different
entities are visually distinct even with similar text — plus an id tag,
status pill (Draft / Published), full timestamp, platform chips, and a
char/hashtag/media stat row. The Calendar's day list and the Drafts panel
both use this same card, just with different action buttons (or none).

**Calendar detail**: each day cell shows up to three small dots colored by
the accent of every distinct platform posted to that day, plus the existing
count badge, so the month view communicates activity and platform mix
before you click into a day.

**Login history**: `mockApi/authApi.js` keeps an in-memory audit log —
every login attempt, successful or not, is recorded with who, when, and
which role (capped at the last 50 entries). `fetchLoginHistory` (a second
async thunk in `authSlice.js`, independent from the login thunk) fetches it
for the Admin tab's "Login history" table. The signed-in user's own header
badge also shows the time their current session started.

**Platform icons**: `components/PlatformIcon.jsx` renders a small, original
glyph per platform (a crossed mark, a camera outline, a network-node
cluster, a chat bubble) — not a literal reproduction of each company's
trademarked logo, but a simple shape tinted with that platform's accent
color, so it's instantly recognizable next to the existing text label. It
shows up everywhere a platform appears: the platform-selector rack,
constraint meters, the composer preview cards, entity-card chips and
avatar badges, the validation log, and the analytics breakdown.

---

## 6. Experiment 5 — Interactive calendar & scheduling

**Time-based data → temporal layout**: `CalendarView.jsx` builds a month
grid (`buildMonthGrid`) from plain date math and maps posts onto it through
the memoized `selectCalendarEvents` selector, which groups posts by
`YYYY-MM-DD`. Each day cell renders up to 3 colored dots (one per distinct
platform posted that day) and a count badge — structured post data mapped
directly onto a temporal grid.

**Scheduling posts from the calendar**: selecting a day and clicking
`+ Schedule for this day` opens an inline quick-compose form (text +
platform toggles). Submitting dispatches `postScheduled` (a new `postsSlice`
action) with `status: 'scheduled'` and `createdAt` set to that day — the
post immediately appears on the calendar with an amber "Scheduled" badge,
distinct from "Published" posts.

**Drag-and-drop rescheduling**: every *scheduled* post in the selected
day's list is `draggable`. Dragging it onto a different day cell and
dropping (native HTML5 Drag and Drop API — `draggable`, `onDragStart`,
`onDragOver`, `onDrop`, no extra library) dispatches `postRescheduled`,
which updates that post's `createdAt` to the new day while keeping its
original time-of-day. Only scheduled posts are draggable — already-
published posts can't be dragged, since a post that already went out isn't
something you'd "reschedule" in a real system.

Scheduling and dragging are both gated by the same `canPublish` role
permission from Experiment 4 — viewers see the calendar read-only, with no
quick-schedule button and no drag handles.

---

## 7. Experiment 6 (1.4.2) — Rendering performance & testing

**Where the bottleneck would be**: a month grid is ~30–35 cells, all
re-rendering on every interaction (selecting a day, dragging over a
different cell) if nothing is done about it — a textbook case for
`React.memo` + reduced closure churn.

**Optimizations applied**:
- `CalendarDay.jsx` was extracted out of `CalendarView` and wrapped in
  `React.memo` — dragging over one cell only re-renders that cell (its
  `isDragOver` prop changed), not all the others.
- **Event delegation**: clicking any day cell is handled by a *single*
  `onClick` on the grid container (`handleGridClick`, reading the clicked
  cell's `data-key` attribute) instead of allocating a new `onClick`
  closure for every one of the ~30 cells on every render.
- `useCallback` wraps every handler passed into memoized children
  (`handleDragStart`, `handleDrop`, `handleGridClick` in `CalendarView`;
  `handleEdit`, `handleDelete` in `DraftsPanel`) so their identity stays
  stable across re-renders.
- Filtering, calendar-grouping, and analytics aggregation are all
  `createSelector`-memoized (Experiment 3), so none of them re-run just
  because the calendar re-rendered for an unrelated reason (e.g. a drag
  hover state change).

**Testing** (`npm test`, via Vitest + React Testing Library):

| File | What it covers |
|------|-----------------|
| `utils/validate.test.js` | character/hashtag/mention/media validation logic, the X-URL weighting rule |
| `utils/permissions.test.js` | role → permission mapping, tab visibility per role |
| `utils/visualId.test.js` | deterministic avatar hue/initials generation |
| `store/postsSlice.test.js` | the `postPublished`/`postScheduled`/`postRescheduled` reducer logic, including immutability |
| `store/postsSelectors.test.js` | `selectFilteredPosts`, `selectCalendarEvents`, `selectAnalytics` against a hand-built fake state |
| `components/ConstraintMeter.test.jsx` | renders correctly from a mock validation result (labels, counts, segment count) |
| `components/CalendarDay.test.jsx` | renders day/count, applies selected/today classes, fires `onDrop`, exposes `data-key` |

Reducers and selectors are tested as plain functions (no store, no
`Provider`, no mocking) since Redux Toolkit's output is just data in,
data out. Components that don't need Redux (`ConstraintMeter`,
`CalendarDay`) are tested directly with React Testing Library; components
that do use `useSelector`/`useDispatch` would need to be wrapped in a
`<Provider store={testStore}>` in the same pattern — see the "Possible
extensions" section below.

---

## 8. Expected outcome (checklist)

- [x] Multi-platform composer with live constraint validation (Exp 1)
- [x] Centralized, normalized Redux Toolkit store for posts/platforms/drafts (Exp 2)
- [x] Memoized selectors for validation, filtering, calendar, and analytics (Exp 2/3)
- [x] Full draft CRUD against a simulated async backend, with loading/error states (Exp 3)
- [x] `React.memo` + `useCallback` to limit re-renders; `React.lazy` for code-splitting (Exp 3)
- [x] Login screen gating the app, with async auth state (Exp 4)
- [x] JWT-style token issued on login, stored in `sessionStorage`, decoded/verified to restore a session on refresh, and attached to every drafts + login-history mock-API call (Exp 4)
- [x] Role-based UI: different tabs and different composer/draft permissions per role (Exp 4)
- [x] Normalized state via `createEntityAdapter` for posts/drafts/platforms (Exp 2, enhanced)
- [x] Unique visual identity per post/draft (avatar, id, status, stats) via shared `EntityCard`
- [x] Calendar shows per-day platform activity dots, not just a count
- [x] Login history audit log (who signed in, when, success/fail) on the Admin tab
- [x] Original per-platform icon glyph shown everywhere a platform appears
- [x] Month-grid calendar mapping structured post data onto a temporal layout (Exp 5)
- [x] Schedule new posts directly from the calendar, distinct "Scheduled" vs "Published" status (Exp 5)
- [x] Native drag-and-drop to reschedule a post to a different day (Exp 5)
- [x] `React.memo` + extracted `CalendarDay` + event delegation to cut re-renders (Exp 6)
- [x] Vitest + React Testing Library suite covering logic and components (Exp 6)

## 7. Possible extensions
- Swap `mockApi/draftsApi.js` for a real REST/GraphQL backend — the thunks
  don't need to change, only the functions they call.
- Add Redux DevTools-driven time-travel debugging notes to the report.
- Persist drafts to `localStorage` so they survive a page refresh (RTK has
  middleware patterns for this).
- Add pagination/virtualization to `DraftsPanel` for very large draft lists.
- Persist the logged-in session (e.g. a token in memory or `sessionStorage`)
  so a refresh doesn't force a re-login.
- Replace the hardcoded `MOCK_USERS` list with a real auth endpoint and
  JWT/session-cookie handling.
- Add a small `renderWithProviders()` test helper (wraps a component in a
  fresh `<Provider store={configureStore(...)}>`) to unit test the
  Redux-connected components (`DraftsPanel`, `CalendarView`, `App`) the
  same way `ConstraintMeter`/`CalendarDay` are tested here.
- Add multi-month calendar navigation (prev/next) instead of the current
  fixed "this month" view.
