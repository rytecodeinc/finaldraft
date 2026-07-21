import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

function applyThemeToDom(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDom(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        applyThemeToDom(next)
        set({ theme: next })
      },
    }),
    {
      name: 'scenedesk-theme',
      onRehydrateStorage: () => (state) => {
        applyThemeToDom(state?.theme ?? 'dark')
      },
    },
  ),
)

// Apply immediately for first paint when already hydrated from storage sync
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('scenedesk-theme')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { theme?: ThemeMode } }
      applyThemeToDom(parsed.state?.theme ?? 'dark')
    } catch {
      applyThemeToDom('dark')
    }
  } else {
    applyThemeToDom('dark')
  }
}
