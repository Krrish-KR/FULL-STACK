import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, api, login, logout, theme } from "./store";
import { filteredPosts, localInput, monthCells, sameDay, csv } from "./utils";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  ChartNoAxesCombined,
  Users,
  Plus,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Save,
  MessageCircle,
  Trash2,
  Pencil,
  Download,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  Eye,
  Heart,
  Clock,
  Menu,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import "./style.css";
const fmt = (n) => Number(n || 0).toLocaleString();
const date = (v) =>
  v
    ? new Date(v).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not scheduled";
const routes = [
  ["Overview", LayoutDashboard],
  ["Content", FileText],
  ["Calendar", CalendarDays],
  ["Analytics", ChartNoAxesCombined],
  ["Team", Users],
];
function Button({ children, icon: Icon, ...props }) {
  return (
    <button {...props}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}
function Badge({ status }) {
  return (
    <span className={"badge " + status.toLowerCase()}>
      <i />
      {status.toLowerCase()}
    </span>
  );
}
function Channel({ name }) {
  return (
    <span className={"channel " + name}>
      {name === "Instagram" ? "◎" : name === "LinkedIn" ? "in" : "𝕏"}
    </span>
  );
}
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const old = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = [
          ...document.querySelectorAll(
            ".modal button,.modal input,.modal textarea,.modal select",
          ),
        ].filter((x) => !x.disabled);
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document.querySelector(".modal input,.modal button")?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Close" className="icon" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function App() {
  const { token, theme: mode } = useSelector((s) => s);
  const dispatch = useDispatch();
  const [page, setPage] = useState("Overview"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [notices, setNotices] = useState(false),
    [mobile, setMobile] = useState(false),
    [days, setDays] = useState(30),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [channel, setChannel] = useState("All channels"),
    [month, setMonth] = useState(new Date()),
    [selectedDay, setSelectedDay] = useState(null),
    [comments, setComments] = useState([]);
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const refresh = useCallback(async () => {
    try {
      const [me, posts, team, notifications, analytics] = await Promise.all(
        [
          "/me",
          "/posts",
          "/team",
          "/notifications",
          "/analytics?days=" + days,
        ].map((p) => api(p)),
      );
      setData({ me, posts, team, notifications, analytics });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [days]);
  useEffect(() => {
    if (!token) {
      setData(null);
      return;
    }
    let active = true,
      t;
    const poll = async () => {
      await refresh();
      if (active) t = setTimeout(poll, 5000);
    };
    poll();
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [token, refresh]);
  async function run(fn, message, close = true) {
    setBusy(true);
    try {
      await fn();
      if (close) setModal(null);
      setToast(message);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function discussion(p) {
    setBusy(true);
    try {
      setComments(await api("/posts/" + p.id + "/comments"));
      setModal({ kind: "comments", post: p });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(p) {
    setPage(p);
    setMobile(false);
    setSelectedDay(null);
  }
  if (!token)
    return (
      <div className="login-screen">
        <div className="login-art">
          <div className="brand">
            <span className="logo">
              <Layers />
            </span>
            SocialFlow<span className="tiny">WORKSPACE</span>
          </div>
          <div>
            <span className="eyebrow">LESS FRICTION. MORE CREATION.</span>
            <h1>
              Your next great
              <br />
              idea deserves
              <br />
              <em>an audience.</em>
            </h1>
            <p>
              Plan, create, and grow together.
              <br />
              One calm space for your social universe.
            </p>
            <div className="orb">✦</div>
          </div>
          <small>Built for teams. Designed for momentum.</small>
        </div>
        <main className="login-form">
          <div>
            <span className="badge scheduled">LOCAL SANDBOX</span>
            <h2>Welcome to your flow.</h2>
            <p className="muted">Sign in to your shared creative workspace.</p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run(async () => {
                  const r = await api(
                    "/auth/login",
                    "POST",
                    Object.fromEntries(f),
                  );
                  dispatch(login(r.token));
                }, "Welcome back");
              }}
            >
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  defaultValue="admin@socialflow.local"
                  required
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  defaultValue="SocialFlow123!"
                  required
                  autoComplete="current-password"
                />
              </label>
              <Button
                className="primary wide"
                disabled={busy}
                icon={ArrowRight}
              >
                {busy ? "Signing in…" : "Enter workspace"}
              </Button>
            </form>
            <div className="demo-note">
              <b>Demo access</b>
              <p>
                admin@socialflow.local · editor@socialflow.local ·
                viewer@socialflow.local
              </p>
              <p>
                Password: <code>SocialFlow123!</code>
              </p>
              <small>
                Publishing is simulated locally. Analytics start with sample
                data.
              </small>
            </div>
          </div>
        </main>
      </div>
    );
  const posts = data?.posts || [],
    me = data?.me,
    canEdit = me && me.role !== "VIEWER",
    isAdmin = me?.role === "ADMIN",
    filtered = filteredPosts(posts, search, status, channel),
    summary = data?.analytics.summary || {},
    unread = data?.notifications.filter((n) => !n.seen).length || 0,
    queued = posts.filter(
      (p) => p.status === "SCHEDULED" || p.status === "QUEUED",
    );
  const newPost = (day) =>
    setModal({
      kind: "post",
      post: day
        ? {
            scheduled_at: new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate(),
              18,
            ).toISOString(),
            status: "SCHEDULED",
          }
        : {},
    });
  const chart = (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data?.analytics.daily || []}
        margin={{ left: 0, right: 12, top: 18, bottom: 0 }}
      >
        <defs>
          <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ca481" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#1ca481" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--line)"
          strokeDasharray="4 4"
        />
        <XAxis
          dataKey="day"
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })
          }
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          minTickGap={40}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="impressions"
          stroke="#1ca481"
          fill="url(#green)"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
  function postTable(list) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Post</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Schedule / published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.title}</b>
                  <small>{p.body.slice(0, 65)}…</small>
                </td>
                <td>
                  <span className="inline">
                    <Channel name={p.channel} />
                    {p.channel}
                  </span>
                </td>
                <td>
                  <Badge status={p.status} />
                </td>
                <td>{date(p.published_at || p.scheduled_at)}</td>
                <td>
                  <div className="inline">
                    <button
                      className="icon"
                      aria-label={"Comments: " + p.title}
                      onClick={() => discussion(p)}
                    >
                      <MessageCircle size={16} />
                    </button>
                    {canEdit && (
                      <>
                        {["DRAFT", "SCHEDULED"].includes(p.status) && (
                          <button
                            className="icon"
                            aria-label={"Edit: " + p.title}
                            onClick={() => setModal({ kind: "post", post: p })}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button
                          className="icon danger"
                          aria-label={"Delete: " + p.title}
                          disabled={busy || p.status === "QUEUED"}
                          onClick={() => {
                            if (confirm("Delete this post and its comments?"))
                              run(
                                () => api("/posts/" + p.id, "DELETE"),
                                "Post deleted",
                              );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <div className="empty">
            No posts match. Adjust your filters or create a post.
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="logo">
            <Layers size={22} />
          </span>
          SocialFlow
        </div>
        <div className="workspace">
          <span className="avatar">S</span>
          <div>
            <b>Studio workspace</b>
            <small>Shared team · Sandbox</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {routes.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Content" && <span>{posts.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox">
            <span>✦</span>
            <b>A safe space to create</b>
            <p>
              Local publishing sandbox.
              <br />
              Sample analytics included.
            </p>
          </div>
          <div className="profile">
            <span className="avatar mint">{me?.name?.slice(0, 1) || "K"}</span>
            <div>
              <b>{me?.name || "Loading…"}</b>
              <small>{me?.role?.toLowerCase()}</small>
            </div>
            <button
              className="icon"
              aria-label="Sign out"
              onClick={() => dispatch(logout())}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="body">
        <header className="topbar">
          <div className="inline">
            <button
              className="icon mobile-toggle"
              aria-label="Toggle menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <span className="muted">Workspace</span>
            <span className="muted">/</span>
            <b>{page}</b>
          </div>
          <div className="inline">
            <span className="live">
              <i /> Sync every 5s
            </span>
            <button
              className="icon"
              aria-label="Toggle dark mode"
              onClick={() => dispatch(theme())}
            >
              {mode === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button
              className="icon notification-button"
              aria-label="Notifications"
              onClick={() => setNotices(!notices)}
            >
              <Bell size={20} />
              {unread > 0 && <i />}
            </button>
          </div>
          {notices && (
            <div className="notification-panel panel">
              <div className="section-head">
                <b>Notifications</b>
                <button
                  onClick={() =>
                    run(
                      () => api("/notifications/read", "POST"),
                      "Marked as read",
                      false,
                    )
                  }
                  disabled={busy}
                >
                  Mark all read
                </button>
              </div>
              {data?.notifications.map((n) => (
                <div
                  key={n.id}
                  className={"notification " + (!n.seen ? "unread" : "")}
                >
                  <p>{n.message}</p>
                  <small>{date(n.created_at)}</small>
                </div>
              ))}
            </div>
          )}
        </header>
        <main className="main">
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={refresh}>Retry</button>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          <div className="heading">
            <div>
              <span className="eyebrow">YOUR CREATIVE COMMAND CENTER</span>
              <h1>
                {page === "Overview"
                  ? `Let's make an impact${me ? ", " + me.name.split(" ")[0] : ""}.`
                  : page === "Content"
                    ? "Your ideas, in motion."
                    : page === "Calendar"
                      ? "A little planning. A lot of possibility."
                      : page === "Analytics"
                        ? "See what resonates."
                        : "Great work is a team effort."}
              </h1>
              <p className="muted">
                {page === "Overview"
                  ? "A clear view of your content, community, and what comes next."
                  : page === "Content"
                    ? "Craft, organize, and collaborate on every story."
                    : page === "Calendar"
                      ? "Your publishing rhythm, all in one place. Times shown in your local timezone."
                      : page === "Analytics"
                        ? "Explore the performance of published posts. Seeded metrics are sample data."
                        : "One shared workspace. The right access for everyone."}
              </p>
            </div>
            {canEdit && page !== "Team" && (
              <Button icon={Plus} className="primary" onClick={() => newPost()}>
                Create post
              </Button>
            )}
            {page === "Team" && isAdmin && (
              <Button
                icon={Plus}
                className="primary"
                onClick={() => setModal({ kind: "team" })}
              >
                Add teammate
              </Button>
            )}
          </div>
          {!data ? (
            <div className="empty">
              <RefreshCw className="spin" /> Connecting to your workspace…
            </div>
          ) : (
            <>
              {(page === "Overview" || page === "Analytics") && (
                <>
                  <div className="section-head">
                    <span className="muted">
                      Performance snapshot{" "}
                      <span className="sample">SAMPLE METRICS</span>
                    </span>
                    <select
                      aria-label="Analytics date range"
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                    </select>
                  </div>
                  <div className="stats">
                    {[
                      [
                        "Impressions",
                        fmt(summary.impressions),
                        Eye,
                        "Across published content",
                      ],
                      [
                        "Engagements",
                        fmt(summary.engagements),
                        Heart,
                        "Likes, comments & shares",
                      ],
                      [
                        "Engagement rate",
                        (
                          (summary.engagements / (summary.impressions || 1)) *
                          100
                        ).toFixed(2) + "%",
                        ChartNoAxesCombined,
                        "Engagements / impressions",
                      ],
                      [
                        "Scheduled posts",
                        queued.length,
                        Clock,
                        "Ready for the next moment",
                      ],
                    ].map(([label, value, Icon, detail]) => (
                      <div className="panel stat" key={label}>
                        <div className="section-head">
                          <span>{label}</span>
                          <span className="stat-icon">
                            <Icon size={19} />
                          </span>
                        </div>
                        <strong>{value}</strong>
                        <small>{detail}</small>
                      </div>
                    ))}
                  </div>
                  <div className="charts-grid">
                    <section className="panel">
                      <div className="section-head">
                        <div>
                          <h2>Content performance</h2>
                          <p className="muted">Impressions over time</p>
                        </div>
                        <span className="chart-label">
                          <i />
                          Impressions
                        </span>
                      </div>
                      {chart}
                    </section>
                    <section className="panel channel-panel">
                      <div className="section-head">
                        <h2>Your channels</h2>
                        <span className="sample">SANDBOX</span>
                      </div>
                      <p className="muted">
                        Where your stories find their audience.
                      </p>
                      {["Instagram", "LinkedIn", "X"].map((c) => {
                        const stats =
                          data.analytics.channels.find(
                            (x) => x.channel === c,
                          ) || {};
                        return (
                          <div className="channel-row" key={c}>
                            <Channel name={c} />
                            <div>
                              <b>{c}</b>
                              <small>
                                {fmt(stats.engagements)} engagements
                              </small>
                            </div>
                            <strong>
                              {fmt(stats.impressions)}
                              <small>impressions</small>
                            </strong>
                          </div>
                        );
                      })}
                      <div className="channel-note">
                        ✦ Keep creating. Every story is a new connection.
                      </div>
                    </section>
                  </div>
                </>
              )}
              {page === "Overview" && (
                <>
                  <div className="section-head next-heading">
                    <h2>
                      Next in your flow{" "}
                      <span className="count">{queued.length}</span>
                    </h2>
                    <Button
                      icon={ArrowUpRight}
                      onClick={() => navigate("Calendar")}
                    >
                      View calendar
                    </Button>
                  </div>
                  <div className="upcoming-grid">
                    {queued
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.scheduled_at) - new Date(b.scheduled_at),
                      )
                      .slice(0, 3)
                      .map((p, i) => (
                        <article key={p.id} className="panel upcoming">
                          <div className={"post-art art-" + i}>
                            <span>
                              {
                                [
                                  "MAKE\nSOMETHING\nMATTER.",
                                  "GOOD IDEAS\nGROW\nTOGETHER.",
                                  "A FRESH\nPOINT\nOF VIEW.",
                                ][i]
                              }
                            </span>
                            <i>✦</i>
                          </div>
                          <div className="section-head">
                            <span className="inline">
                              <Channel name={p.channel} />
                              {p.channel}
                            </span>
                            <Badge status={p.status} />
                          </div>
                          <h3>{p.title}</h3>
                          <div className="section-head">
                            <small>{date(p.scheduled_at)}</small>
                            <button
                              className="icon"
                              aria-label={"Open " + p.title}
                              onClick={() =>
                                canEdit && p.status === "SCHEDULED"
                                  ? setModal({ kind: "post", post: p })
                                  : discussion(p)
                              }
                            >
                              <ArrowUpRight size={18} />
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                  {!queued.length && (
                    <div className="empty">
                      Your schedule is clear. Create your next story.
                    </div>
                  )}
                </>
              )}
              {page === "Content" && (
                <section className="panel">
                  <div className="filters">
                    <label className="search">
                      <Search size={17} />
                      <input
                        placeholder="Search your content…"
                        aria-label="Search posts"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filter status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {[
                        "All statuses",
                        "DRAFT",
                        "SCHEDULED",
                        "QUEUED",
                        "PUBLISHED",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter channel"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                    >
                      {["All channels", "Instagram", "LinkedIn", "X"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                    <span className="muted">{filtered.length} posts</span>
                  </div>
                  {postTable(filtered)}
                </section>
              )}
              {page === "Calendar" && (
                <section className="panel">
                  <div className="section-head">
                    <h2>
                      {month.toLocaleDateString([], {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <div className="inline">
                      <Button
                        onClick={() => {
                          setMonth(new Date());
                          setSelectedDay(null);
                        }}
                      >
                        Today
                      </Button>
                      <button
                        className="icon"
                        aria-label="Previous month"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        className="icon"
                        aria-label="Next month"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() + 1,
                              1,
                            ),
                          )
                        }
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                  <div className="calendar">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <div className="weekday" key={d}>
                          {d}
                        </div>
                      ),
                    )}
                    {monthCells(month.getFullYear(), month.getMonth()).map(
                      (d) => {
                        const items = posts.filter(
                          (p) =>
                            (p.scheduled_at || p.published_at) &&
                            sameDay(p.published_at || p.scheduled_at, d),
                        );
                        return (
                          <button
                            key={d.toISOString()}
                            onClick={() => setSelectedDay(d)}
                            className={
                              "day " +
                              (d.getMonth() !== month.getMonth()
                                ? "other "
                                : "") +
                              (sameDay(d, new Date()) ? "today " : "") +
                              (selectedDay && sameDay(selectedDay, d)
                                ? "selected"
                                : "")
                            }
                          >
                            <span>{d.getDate()}</span>
                            {items.slice(0, 2).map((p) => (
                              <small
                                key={p.id}
                                className={p.status.toLowerCase()}
                              >
                                {p.title}
                              </small>
                            ))}
                            {items.length > 2 && (
                              <small>+{items.length - 2} more</small>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                  {selectedDay && (
                    <div className="day-detail">
                      <div className="section-head">
                        <h3>
                          {selectedDay.toLocaleDateString([], {
                            dateStyle: "full",
                          })}
                        </h3>
                        {canEdit && (
                          <Button
                            icon={Plus}
                            onClick={() => newPost(selectedDay)}
                          >
                            Plan a post
                          </Button>
                        )}
                      </div>
                      {postTable(
                        posts.filter(
                          (p) =>
                            (p.scheduled_at || p.published_at) &&
                            sameDay(
                              p.published_at || p.scheduled_at,
                              selectedDay,
                            ),
                        ),
                      )}
                    </div>
                  )}
                </section>
              )}
              {page === "Analytics" && (
                <section className="panel">
                  <div className="section-head">
                    <h2>Engagement by channel</h2>
                    <Button
                      icon={Download}
                      onClick={() => {
                        const included = posts.filter(
                          (p) =>
                            p.published_at &&
                            new Date(p.published_at) >=
                              new Date(Date.now() - days * 86400000),
                        );
                        const u = URL.createObjectURL(
                          new Blob([csv(included)], {
                            type: "text/csv;charset=utf-8",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = u;
                        a.download = "socialflow-analytics.csv";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(u), 1000);
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.analytics.channels}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="channel" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          background: "var(--panel)",
                          border: "1px solid var(--line)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="engagements"
                        fill="#22a785"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <h3>Published content</h3>
                  {postTable(
                    posts.filter(
                      (p) =>
                        p.published_at &&
                        new Date(p.published_at) >=
                          new Date(Date.now() - days * 86400000),
                    ),
                  )}
                </section>
              )}
              {page === "Team" && (
                <>
                  <div className="team-grid">
                    {data.team.map((m, i) => (
                      <article className="panel member" key={m.id}>
                        <span className={"avatar large color-" + (i % 3)}>
                          {m.name
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <h2>
                          {m.name} {m.id === me.id && <small>(you)</small>}
                        </h2>
                        <p className="muted">{m.email}</p>
                        {isAdmin && m.id !== me.id ? (
                          <select
                            aria-label={"Role for " + m.name}
                            disabled={busy}
                            value={m.role}
                            onChange={(e) =>
                              run(
                                () =>
                                  api("/team/" + m.id, "PATCH", {
                                    role: e.target.value,
                                  }),
                                "Role updated",
                                false,
                              )
                            }
                          >
                            {["ADMIN", "EDITOR", "VIEWER"].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="role">{m.role}</span>
                        )}
                      </article>
                    ))}
                  </div>
                  <div className="panel permissions">
                    <h2>Room for everyone. Clear responsibilities.</h2>
                    <p>
                      <b>Admin</b> manages people and all content. <b>Editor</b>{" "}
                      creates, schedules, edits, deletes, and comments.{" "}
                      <b>Viewer</b> reads content, analytics, and discussions.
                      All members share this single workspace.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          <footer>
            SocialFlow <span>Made for your next great idea.</span>
            <span>Experiments 3.3.1 & 3.3.2 · Local sandbox</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          title={
            modal.kind === "post"
              ? modal.post.id
                ? "Edit your story"
                : "Create something great"
              : modal.kind === "team"
                ? "Bring someone into the flow"
                : "Team discussion"
          }
          onClose={() => !busy && setModal(null)}
        >
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {modal.kind === "post" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                const action = e.nativeEvent.submitter?.value || "DRAFT";
                const payload = {
                  title: f.title,
                  body: f.body,
                  channel: f.channel,
                  status: action,
                  scheduledAt:
                    action === "SCHEDULED" && f.scheduledAt
                      ? new Date(f.scheduledAt).toISOString()
                      : null,
                };
                run(
                  () =>
                    api(
                      "/posts" + (modal.post.id ? "/" + modal.post.id : ""),
                      modal.post.id ? "PUT" : "POST",
                      payload,
                    ),
                  action === "QUEUED"
                    ? "Added to publishing queue"
                    : "Post saved",
                );
              }}
            >
              <label>
                Post title
                <input
                  name="title"
                  maxLength={140}
                  required
                  defaultValue={modal.post.title || ""}
                  placeholder="Give your idea a name"
                />
              </label>
              <label>
                Channel
                <select
                  name="channel"
                  defaultValue={modal.post.channel || "Instagram"}
                >
                  {["Instagram", "LinkedIn", "X"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Your story
                <textarea
                  name="body"
                  maxLength={2200}
                  rows={6}
                  required
                  defaultValue={modal.post.body || ""}
                  placeholder="What would you like to share?"
                />
              </label>
              <label>
                Schedule time (your local timezone)
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={localInput(modal.post.scheduled_at)}
                />
              </label>
              <p className="muted">
                Publish now sends this post through Kafka to the local sandbox.
                No real social account is contacted.
              </p>
              <div className="modal-actions">
                <Button type="submit" value="DRAFT" icon={Save} disabled={busy}>
                  Save draft
                </Button>
                <Button
                  type="submit"
                  value="SCHEDULED"
                  icon={CalendarDays}
                  disabled={busy}
                >
                  Schedule
                </Button>
                <Button
                  type="submit"
                  value="QUEUED"
                  icon={Send}
                  className="primary"
                  disabled={busy}
                >
                  Publish now
                </Button>
              </div>
            </form>
          )}
          {modal.kind === "team" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                run(() => api("/team", "POST", f), "Teammate added");
              }}
            >
              <label>
                Full name
                <input name="name" required maxLength={80} />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={160} />
              </label>
              <label>
                Initial password
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Role
                <select name="role">
                  <option>EDITOR</option>
                  <option>VIEWER</option>
                  <option>ADMIN</option>
                </select>
              </label>
              <p className="muted">
                Creates a local account immediately. Share credentials securely;
                no invitation email is sent.
              </p>
              <Button className="primary" disabled={busy} icon={Plus}>
                Create account
              </Button>
            </form>
          )}
          {modal.kind === "comments" && (
            <>
              <p className="muted">{modal.post.title}</p>
              <div className="comments">
                {comments.map((c) => (
                  <article key={c.id}>
                    <b>{c.author}</b>
                    <small>{date(c.created_at)}</small>
                    <p>{c.body}</p>
                  </article>
                ))}
                {!comments.length && (
                  <p className="empty">Start a thoughtful conversation.</p>
                )}
              </div>
              {canEdit && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const body = new FormData(form).get("body");
                    run(
                      async () => {
                        await api(
                          "/posts/" + modal.post.id + "/comments",
                          "POST",
                          { body },
                        );
                        setComments(
                          await api("/posts/" + modal.post.id + "/comments"),
                        );
                        form.reset();
                      },
                      "Comment added",
                      false,
                    );
                  }}
                >
                  <label>
                    Comment
                    <textarea name="body" rows={3} required maxLength={1000} />
                  </label>
                  <Button className="primary" disabled={busy} icon={Send}>
                    Send comment
                  </Button>
                </form>
              )}
            </>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>,
);
