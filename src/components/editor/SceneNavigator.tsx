import { extractScenes } from '@/screenplay/elementRules'
import { useScriptStore } from '@/stores/scriptStore'

export function SceneNavigator() {
  const elements = useScriptStore((s) => s.doc.elements)
  const selectedId = useScriptStore((s) => s.selectedId)
  const requestFocus = useScriptStore((s) => s.requestFocus)
  const scenes = extractScenes(elements)

  const activeSceneId = (() => {
    if (!selectedId) return scenes[0]?.id ?? null
    let current: string | null = null
    for (const scene of scenes) {
      const index = elements.findIndex((el) => el.id === scene.id)
      const selectedIndex = elements.findIndex((el) => el.id === selectedId)
      if (index <= selectedIndex) current = scene.id
      else break
    }
    return current
  })()

  return (
    <aside className="scene-nav" aria-label="Scene navigator">
      <div className="scene-nav-header">
        <h2>Scenes</h2>
        <span className="scene-nav-count">{scenes.length}</span>
      </div>
      <div className="scene-nav-list">
        {scenes.length === 0 ? (
          <p className="scene-nav-empty">
            No scene headings yet. Press Tab to set a line to Scene, or use New Scene.
          </p>
        ) : (
          scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={`scene-nav-item ${activeSceneId === scene.id ? 'is-active' : ''}`.trim()}
              onClick={() => {
                requestFocus(scene.id)
                document
                  .querySelector(`[data-element-id="${scene.id}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            >
              <span className="scene-nav-number">{scene.number}</span>
              <span className="scene-nav-heading">{scene.heading}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
