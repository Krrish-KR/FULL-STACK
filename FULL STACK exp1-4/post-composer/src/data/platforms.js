// Each platform entry defines the constraints the composer must enforce.
// Limits are simplified for teaching purposes but modeled on real platform rules.

export const PLATFORMS = [
  {
    id: 'x',
    label: 'X',
    handle: '@yourhandle',
    color: '#E7E9EA',
    accent: '#1D9BF0',
    charLimit: 280,
    warnAt: 0.9,
    maxHashtags: 10,
    maxMentions: 10,
    maxMedia: 4,
    previewChars: 280,
    notes: 'Links always count as 23 characters regardless of length.'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@yourhandle',
    color: '#F5F5F5',
    accent: '#E1306C',
    charLimit: 2200,
    warnAt: 0.9,
    maxHashtags: 30,
    maxMentions: 20,
    maxMedia: 10,
    previewChars: 125,
    notes: 'Caption is clipped after ~125 characters until "more" is tapped.'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'Your Name',
    color: '#F3F2EE',
    accent: '#0A66C2',
    charLimit: 3000,
    warnAt: 0.9,
    maxHashtags: 5,
    maxMentions: 20,
    maxMedia: 9,
    previewChars: 210,
    notes: 'Feed preview clips after ~210 characters behind "see more".'
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'Your Page',
    color: '#F0F2F5',
    accent: '#1877F2',
    charLimit: 63206,
    warnAt: 0.9,
    maxHashtags: 10,
    maxMentions: 50,
    maxMedia: 10,
    previewChars: 477,
    notes: 'Long posts are technically allowed but engagement drops sharply after ~500 characters.'
  }
]

export const getPlatform = (id) => PLATFORMS.find((p) => p.id === id)
