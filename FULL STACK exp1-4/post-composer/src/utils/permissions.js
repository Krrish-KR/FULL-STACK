// Central place that answers "can this role do X" so components never
// hardcode role checks inline - they just read one flag from here.

export const ROLES = ['viewer', 'editor', 'admin']

export const ROLE_PERMISSIONS = {
  viewer: {
    label: 'Viewer',
    canPublish: false,
    canSaveDraft: false,
    canEditDraft: false,
    canDeleteDraft: false,
    tabs: ['composer', 'drafts', 'calendar', 'analytics']
  },
  editor: {
    label: 'Editor',
    canPublish: true,
    canSaveDraft: true,
    canEditDraft: true,
    canDeleteDraft: true,
    tabs: ['composer', 'drafts', 'calendar', 'analytics']
  },
  admin: {
    label: 'Admin',
    canPublish: true,
    canSaveDraft: true,
    canEditDraft: true,
    canDeleteDraft: true,
    tabs: ['composer', 'drafts', 'calendar', 'analytics', 'admin']
  }
}

export function can(role, permissionKey) {
  return Boolean(ROLE_PERMISSIONS[role]?.[permissionKey])
}

export function tabsForRole(role) {
  return ROLE_PERMISSIONS[role]?.tabs ?? []
}
