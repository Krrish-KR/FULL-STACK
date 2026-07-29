import { describe, it, expect } from 'vitest'
import { can, tabsForRole, ROLE_PERMISSIONS } from '../../utils/permissions.js'

describe('can()', () => {
  it('viewer cannot publish, save, edit, or delete', () => {
    expect(can('viewer', 'canPublish')).toBe(false)
    expect(can('viewer', 'canSaveDraft')).toBe(false)
    expect(can('viewer', 'canEditDraft')).toBe(false)
    expect(can('viewer', 'canDeleteDraft')).toBe(false)
  })

  it('editor can publish, save, edit, and delete', () => {
    expect(can('editor', 'canPublish')).toBe(true)
    expect(can('editor', 'canSaveDraft')).toBe(true)
    expect(can('editor', 'canEditDraft')).toBe(true)
    expect(can('editor', 'canDeleteDraft')).toBe(true)
  })

  it('admin has every permission editor has', () => {
    Object.keys(ROLE_PERMISSIONS.editor).forEach((key) => {
      if (key === 'label' || key === 'tabs') return
      expect(ROLE_PERMISSIONS.admin[key]).toBe(ROLE_PERMISSIONS.editor[key])
    })
  })

  it('returns false for an unknown role instead of throwing', () => {
    expect(can('not-a-real-role', 'canPublish')).toBe(false)
  })
})

describe('tabsForRole()', () => {
  it('only admin sees the admin tab', () => {
    expect(tabsForRole('admin')).toContain('admin')
    expect(tabsForRole('editor')).not.toContain('admin')
    expect(tabsForRole('viewer')).not.toContain('admin')
  })

  it('every role can see the core content tabs', () => {
    const core = ['composer', 'drafts', 'calendar', 'analytics']
    ;['viewer', 'editor', 'admin'].forEach((role) => {
      core.forEach((tab) => expect(tabsForRole(role)).toContain(tab))
    })
  })

  it('returns an empty array for an unrecognized role', () => {
    expect(tabsForRole('ghost')).toEqual([])
  })
})
