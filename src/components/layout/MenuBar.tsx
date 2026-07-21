import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const MENUS = [
  {
    label: 'File',
    items: [
      { label: 'New Project', shortcut: '⌘N' },
      { label: 'Open…', shortcut: '⌘O' },
      { label: 'Save', shortcut: '⌘S' },
      { separator: true },
      { label: 'Export PDF…' },
      { label: 'Import Fountain…' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: '⌘Z' },
      { label: 'Redo', shortcut: '⇧⌘Z' },
      { separator: true },
      { label: 'Find…', shortcut: '⌘F' },
      { label: 'Replace…', shortcut: '⌘H' },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Toggle Sidebar', shortcut: '⌘B' },
      { label: 'Toggle Inspector', shortcut: '⌘I' },
      { label: 'Toggle Bottom Panel', shortcut: '⌘J' },
      { separator: true },
      { label: 'Zoom In', shortcut: '⌘+' },
      { label: 'Zoom Out', shortcut: '⌘-' },
    ],
  },
  {
    label: 'Format',
    items: [
      { label: 'Scene Heading' },
      { label: 'Action' },
      { label: 'Character' },
      { label: 'Dialogue' },
      { label: 'Transition' },
    ],
  },
  {
    label: 'Production',
    items: [
      { label: 'Revision Mode' },
      { label: 'Lock Pages' },
      { label: 'Generate Reports…' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Keyboard Shortcuts' },
      { label: 'Documentation' },
      { label: 'About SceneDesk' },
    ],
  },
] as const

type MenuItem =
  | { label: string; shortcut?: string; separator?: false }
  | { separator: true; label?: never; shortcut?: never }

function BrandMark() {
  return (
    <div className="brand" aria-label="SceneDesk">
      <div className="brand-mark">
        <svg viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M2 2.5h10v1.6H2V2.5zm0 3.6h7V7.7H2V6.1zm0 3.6h9V11.3H2v-1.6z"
            fill="#E8A838"
          />
        </svg>
      </div>
      <div className="brand-name">
        Scene<span>Desk</span>
      </div>
    </div>
  )
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <header className="menubar" ref={rootRef}>
      <BrandMark />
      <nav className="menubar-menus" aria-label="Application menu">
        {MENUS.map((menu) => (
          <div key={menu.label} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className="menu-item"
              aria-expanded={openMenu === menu.label}
              aria-haspopup="menu"
              onClick={() => setOpenMenu((current) => (current === menu.label ? null : menu.label))}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(menu.label)
              }}
            >
              {menu.label}
            </button>
            {openMenu === menu.label ? (
              <div className="menu-dropdown" role="menu">
                {(menu.items as readonly MenuItem[]).map((item, index) =>
                  item.separator ? (
                    <div key={`sep-${index}`} className="menu-separator" role="separator" />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className="menu-dropdown-item"
                      role="menuitem"
                      onClick={() => setOpenMenu(null)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
      <div className="menubar-spacer" />
      <div className="menubar-actions">
        <ThemeToggle />
      </div>
    </header>
  )
}
