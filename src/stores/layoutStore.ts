import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarOpen: boolean
  sidebarWidth: number
  inspectorOpen: boolean
  inspectorWidth: number
  bottomPanelOpen: boolean
  bottomPanelHeight: number
  bottomPanelTab: 'problems' | 'output' | 'timeline'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setInspectorOpen: (open: boolean) => void
  toggleInspector: () => void
  setInspectorWidth: (width: number) => void
  setBottomPanelOpen: (open: boolean) => void
  toggleBottomPanel: () => void
  setBottomPanelHeight: (height: number) => void
  setBottomPanelTab: (tab: LayoutState['bottomPanelTab']) => void
}

export const SIDEBAR_MIN = 200
export const SIDEBAR_MAX = 360
export const SIDEBAR_DEFAULT = 248
export const INSPECTOR_MIN = 240
export const INSPECTOR_MAX = 420
export const INSPECTOR_DEFAULT = 280
export const BOTTOM_MIN = 120
export const BOTTOM_MAX = 420
export const BOTTOM_DEFAULT = 180

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: SIDEBAR_DEFAULT,
      inspectorOpen: true,
      inspectorWidth: INSPECTOR_DEFAULT,
      bottomPanelOpen: false,
      bottomPanelHeight: BOTTOM_DEFAULT,
      bottomPanelTab: 'problems',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (sidebarWidth) =>
        set({
          sidebarWidth: Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, sidebarWidth)),
        }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorWidth: (inspectorWidth) =>
        set({
          inspectorWidth: Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, inspectorWidth)),
        }),
      setBottomPanelOpen: (bottomPanelOpen) => set({ bottomPanelOpen }),
      toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
      setBottomPanelHeight: (bottomPanelHeight) =>
        set({
          bottomPanelHeight: Math.min(BOTTOM_MAX, Math.max(BOTTOM_MIN, bottomPanelHeight)),
        }),
      setBottomPanelTab: (bottomPanelTab) => set({ bottomPanelTab }),
    }),
    {
      name: 'scenedesk-layout',
    },
  ),
)
