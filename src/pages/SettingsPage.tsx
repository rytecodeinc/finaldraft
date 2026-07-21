import { Keyboard, Monitor, SlidersHorizontal } from 'lucide-react'
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen'
import { Button } from '@/components/ui/Button'
import { useLayoutStore } from '@/stores/layoutStore'
import { useThemeStore } from '@/stores/themeStore'

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen)
  const inspectorOpen = useLayoutStore((s) => s.inspectorOpen)
  const bottomPanelOpen = useLayoutStore((s) => s.bottomPanelOpen)
  const setSidebarOpen = useLayoutStore((s) => s.setSidebarOpen)
  const setInspectorOpen = useLayoutStore((s) => s.setInspectorOpen)
  const setBottomPanelOpen = useLayoutStore((s) => s.setBottomPanelOpen)

  return (
    <PlaceholderScreen
      kicker="System"
      title="Settings"
      description="Workspace preferences persist locally. Theme, panel visibility, and layout widths are remembered between sessions."
      cards={[
        {
          title: 'Appearance',
          description: 'Light and dark themes tuned for long writing sessions.',
          icon: Monitor,
        },
        {
          title: 'Layout',
          description: 'Sidebar, inspector, and bottom panel defaults.',
          icon: SlidersHorizontal,
        },
        {
          title: 'Shortcuts',
          description: '⌘B sidebar · ⌘I inspector · ⌘J bottom panel.',
          icon: Keyboard,
        },
      ]}
    >
      <div
        className="placeholder-grid"
        style={{ marginBottom: 28, animationDelay: '40ms' }}
      >
        <article className="placeholder-block">
          <h3>Theme</h3>
          <p style={{ marginBottom: 14 }}>
            Currently using <strong>{theme}</strong> mode.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={theme === 'light' ? 'primary' : 'subtle'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'subtle'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
          </div>
        </article>

        <article className="placeholder-block">
          <h3>Panels</h3>
          <p style={{ marginBottom: 14 }}>
            Toggle shell panels used across every screen.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button
              variant={sidebarOpen ? 'primary' : 'subtle'}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              Sidebar
            </Button>
            <Button
              variant={inspectorOpen ? 'primary' : 'subtle'}
              onClick={() => setInspectorOpen(!inspectorOpen)}
            >
              Inspector
            </Button>
            <Button
              variant={bottomPanelOpen ? 'primary' : 'subtle'}
              onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
            >
              Bottom
            </Button>
          </div>
        </article>
      </div>
    </PlaceholderScreen>
  )
}
