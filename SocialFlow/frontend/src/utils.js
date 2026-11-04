export function filteredPosts(posts, search, status, channel) {
  return posts.filter(
    (p) =>
      (p.title + " " + p.body).toLowerCase().includes(search.toLowerCase()) &&
      (status === "All statuses" || p.status === status) &&
      (channel === "All channels" || p.channel === channel),
  );
}
export function localInput(value) {
  const d = value ? new Date(value) : new Date(Date.now() + 3600000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function monthCells(year, month) {
  const start = new Date(year, month, 1);
  const offset = (start.getDay() + 6) % 7;
  return Array.from(
    { length: 42 },
    (_, i) => new Date(year, month, i - offset + 1),
  );
}
export function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
export function csv(posts) {
  const quote = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    ["Title", "Channel", "Status", "Impressions", "Engagements"],
    ...posts.map((p) => [
      p.title,
      p.channel,
      p.status,
      p.impressions,
      p.engagements,
    ]),
  ]
    .map((r) => r.map(quote).join(","))
    .join("\r\n");
}
