import { configureStore, createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "session",
  initialState: {
    token: sessionStorage.getItem("sf-token"),
    theme: localStorage.getItem("sf-theme") || "light",
  },
  reducers: {
    login(s, a) {
      s.token = a.payload;
      sessionStorage.setItem("sf-token", a.payload);
    },
    logout(s) {
      s.token = null;
      sessionStorage.removeItem("sf-token");
    },
    theme(s) {
      s.theme = s.theme === "light" ? "dark" : "light";
      localStorage.setItem("sf-theme", s.theme);
    },
  },
});
export const { login, logout, theme } = slice.actions;
export const store = configureStore({ reducer: slice.reducer });
export async function api(path, method = "GET", body) {
  const token = store.getState().token;
  const r = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 401) {
    store.dispatch(logout());
    throw Error("Session expired or invalid credentials. Please sign in.");
  }
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw Error("Server returned an invalid response. Check backend status.");
  }
  if (!r.ok) throw Error(data?.message || `Request failed (${r.status})`);
  return data;
}
