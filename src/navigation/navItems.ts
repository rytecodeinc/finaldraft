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

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  section: NavSection
  description: string
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
    description: 'Structured screenplay editor — coming in a later milestone.',
  },
  {
    id: 'outline',
    label: 'Outline',
    path: '/outline',
    icon: ListTree,
    section: 'story',
    description: 'Hierarchical scene and sequence outline.',
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
    description: 'Character bible and relationships.',
  },
  {
    id: 'locations',
    label: 'Locations',
    path: '/locations',
    icon: MapPin,
    section: 'story',
    description: 'Sets, places, and location notes.',
  },
  {
    id: 'notes',
    label: 'Notes',
    path: '/notes',
    icon: StickyNote,
    section: 'story',
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

export function getNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === '/') return NAV_ITEMS.find((item) => item.path === '/')
  return NAV_ITEMS.find((item) => item.path !== '/' && pathname.startsWith(item.path))
}
