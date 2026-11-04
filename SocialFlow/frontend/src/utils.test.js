import { describe, it, expect } from "vitest";
import { filteredPosts, localInput, monthCells, sameDay, csv } from "./utils";
describe("content utilities", () => {
  const posts = [
    {
      title: "Launch",
      body: "Hello",
      channel: "X",
      status: "DRAFT",
      impressions: 0,
      engagements: 0,
    },
    {
      title: "Team",
      body: "People",
      channel: "LinkedIn",
      status: "PUBLISHED",
      impressions: 100,
      engagements: 10,
    },
  ];
  it("combines search, status and channel", () => {
    expect(filteredPosts(posts, "hello", "DRAFT", "X")).toHaveLength(1);
    expect(
      filteredPosts(posts, "", "All statuses", "All channels"),
    ).toHaveLength(2);
    expect(filteredPosts(posts, "", "PUBLISHED", "X")).toHaveLength(0);
  });
  it("returns a complete Monday-first calendar", () => {
    const c = monthCells(2026, 9);
    expect(c).toHaveLength(42);
    expect(c[0].getDay()).toBe(1);
    expect(c.some((d) => d.getDate() === 31 && d.getMonth() === 9)).toBe(true);
  });
  it("handles local dates", () => {
    const s = localInput("2026-10-29T10:00:00Z");
    expect(s).toMatch(/^2026-10-29T/);
    expect(localInput()).toHaveLength(16);
    expect(sameDay(new Date(), new Date())).toBe(true);
    expect(sameDay("2026-01-01", "2026-01-02")).toBe(false);
  });
  it("escapes CSV and neutralizes formulas", () => {
    expect(csv([{ ...posts[0], title: "=SUM(A1)" }])).toContain("'=SUM(A1)");
    expect(csv([{ ...posts[0], title: 'Say "Hi"' }])).toContain('"Say ""Hi"""');
    expect(csv(posts).split("\r\n")).toHaveLength(3);
  });
});
