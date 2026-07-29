import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConstraintMeter from '../../components/ConstraintMeter.jsx'
import { getPlatform } from '../../data/platforms.js'

const platform = getPlatform('x')

function makeResult(overrides = {}) {
  return {
    platformId: 'x',
    length: 50,
    ratio: 50 / platform.charLimit,
    hashtagCount: 1,
    mentionCount: 0,
    errors: [],
    warnings: [],
    status: 'ok',
    ...overrides
  }
}

describe('<ConstraintMeter />', () => {
  it('shows the platform label and the character usage fraction', () => {
    render(<ConstraintMeter platform={platform} result={makeResult()} />)
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText(`50 / ${platform.charLimit.toLocaleString()}`)).toBeInTheDocument()
  })

  it('shows the hashtag and mention counts', () => {
    render(<ConstraintMeter platform={platform} result={makeResult({ hashtagCount: 3, mentionCount: 2 })} />)
    expect(screen.getByText(`#3/${platform.maxHashtags}`)).toBeInTheDocument()
    expect(screen.getByText(`@2/${platform.maxMentions}`)).toBeInTheDocument()
  })

  it('renders the segmented usage bar', () => {
    const { container } = render(<ConstraintMeter platform={platform} result={makeResult()} />)
    const segments = container.querySelectorAll('.meter-segment')
    expect(segments.length).toBe(24)
  })
})
