import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ListTree,
  LayoutGrid,
  Users,
  MapPin,
  StickyNote,
  GitBranch,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavSection = 'workspace' | 'story' | 'production' | 'system'

export type StoryView = 'script' | 'outline' | 'characters' | 'locations' | 'notes'

export interface NavItem {
  id: string
  label: string
  /** Path template; use projectPath() for project-scoped story items. */
  path: string
  icon: LucideIcon
  section: NavSection
  description: string
  /** When set, path is under /p/:projectId/... */
  storyView?: StoryView
}

export const NAV_SECTIONS: { id: NavSection; label: string }[] = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'story', label: 'Story' },
  { id: 'production', label: 'Production' },
  { id: 'system', label: 'System' },
]

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    section: 'workspace',
    description: 'Overview of your writing activity and open projects.',
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    section: 'workspace',
    description: 'Browse and manage screenplay projects.',
  },
  {
    id: 'script',
    label: 'Script',
    path: '/script',
    icon: FileText,
    section: 'story',
    storyView: 'script',
    description: 'Structured screenplay editor.',
  },
  {
    id: 'outline',
    label: 'Outline',
    path: '/outline',
    icon: ListTree,
    section: 'story',
    storyView: 'outline',
    description: 'Scene list derived from the screenplay.',
  },
  {
    id: 'beat-board',
    label: 'Beat Board',
    path: '/beat-board',
    icon: LayoutGrid,
    section: 'story',
    description: 'Visual beat cards for story structure.',
  },
  {
    id: 'characters',
    label: 'Characters',
    path: '/characters',
    icon: Users,
    section: 'story',
    storyView: 'characters',
    description: 'Characters derived from dialogue cues.',
  },
  {
    id: 'locations',
    label: 'Locations',
    path: '/locations',
    icon: MapPin,
    section: 'story',
    storyView: 'locations',
    description: 'Locations derived from scene headings.',
  },
  {
    id: 'notes',
    label: 'Notes',
    path: '/notes',
    icon: StickyNote,
    section: 'story',
    storyView: 'notes',
    description: 'Research, ideas, and freeform notes.',
  },
  {
    id: 'revisions',
    label: 'Revisions',
    path: '/revisions',
    icon: GitBranch,
    section: 'production',
    description: 'Revision history and colored draft pages.',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    section: 'production',
    description: 'Scene reports, character reports, and production stats.',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    section: 'system',
    description: 'Preferences, theme, and workspace defaults.',
  },
]

export function projectPath(projectId: string, view: StoryView): string {
  return `/p/${projectId}/${view}`
}

/** Character detail under Characters. Name is URL-encoded uppercase cue name. */
export function characterPath(projectId: string, name: string): string {
  return `${projectPath(projectId, 'characters')}/${encodeURIComponent(
    name.trim().toUpperCase(),
  )}`
}

export function parseProjectPath(pathname: string): {
  projectId: string
  view: StoryView
  /** Detail slug for nested story routes (e.g. character name). */
  detail?: string
} | null {
  const match = pathname.match(
    /^\/p\/([^/]+)\/(script|outline|characters|locations|notes)(?:\/([^/?#]+))?\/?$/,
  )
  if (!match) return null
  const view = match[2] as StoryView
  const rawDetail = match[3]
  let detail: string | undefined
  if (rawDetail && view === 'characters') {
    try {
      detail = decodeURIComponent(rawDetail).trim().toUpperCase()
    } catch {
      detail = rawDetail.trim().toUpperCase()
    }
    if (!detail) detail = undefined
  }
  return {
    projectId: match[1]!,
    view,
    detail,
  }
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  const project = parseProjectPath(pathname)
  if (project) {
    return NAV_ITEMS.find((item) => item.storyView === project.view)
  }
  if (pathname === '/') return NAV_ITEMS.find((item) => item.path === '/')
  // Legacy story routes still resolve to labels.
  return NAV_ITEMS.find(
    (item) => item.path !== '/' && pathname.startsWith(item.path),
  )
}

export function isScriptPath(pathname: string): boolean {
  return (
    parseProjectPath(pathname)?.view === 'script' ||
    pathname.startsWith('/script')
  )
}
