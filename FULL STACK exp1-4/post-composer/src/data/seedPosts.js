// Deterministic (no Math.random at module scope) seed posts so the
// calendar and analytics views have realistic data immediately, without
// needing a real backend. Dates are generated relative to "today" so the
// demo always looks current.

const PLATFORM_CYCLE = ['x', 'instagram', 'linkedin', 'facebook']
const SAMPLE_TEXTS = [
  'Shipping a new feature today, excited for feedback! #ProductLaunch',
  'Behind the scenes of our design process this week.',
  'Hiring update: two new roles just opened on the platform team.',
  'Customer spotlight: how one team cut onboarding time in half.',
  'Quick thread on what we learned from last quarter\'s launch.',
  'Reminder: our webinar starts in one hour. Link in bio.',
  'Small UI polish pass shipped — smoother animations across the app.',
  'We hit a milestone today, thank you to everyone who helped.',
  'New blog post is live covering our latest architecture change.',
  'Weekend reading list from the team, what are you working through?'
]

function dayOffset(daysAgo) {
  const d = new Date()
  d.setHours(9 + (daysAgo % 6), 15, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export function buildSeedPosts() {
  const posts = []
  for (let i = 0; i < 16; i++) {
    const daysAgo = Math.floor(i * 1.8) // spread across ~28 days
    const platformId = PLATFORM_CYCLE[i % PLATFORM_CYCLE.length]
    const text = SAMPLE_TEXTS[i % SAMPLE_TEXTS.length]
    const hashtagCount = (text.match(/#/g) || []).length
    posts.push({
      id: `seed-post-${i}`,
      text,
      platformIds: [platformId],
      mediaCount: i % 3,
      length: [...text].length,
      hashtagCount,
      status: 'published',
      createdAt: dayOffset(daysAgo)
    })
  }
  return posts
}
