import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectPath } from '@/navigation/navItems'
import { useScriptStore } from '@/stores/scriptStore'

export function CharactersPage() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const elements = useScriptStore((s) => s.doc.elements)
  const getCharacters = useScriptStore((s) => s.getCharacters)
  const selectElement = useScriptStore((s) => s.selectElement)
  const requestFocus = useScriptStore((s) => s.requestFocus)

  const characters = useMemo(() => getCharacters(), [getCharacters, elements])

  const firstCueId = (name: string) => {
    const upper = name.toUpperCase()
    return (
      elements.find(
        (el) =>
          el.type === 'character' &&
          el.text.replace(/\(.*?\)/g, '').trim().toUpperCase() === upper,
      )?.id ?? null
    )
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{projectName}</p>
          <h1 className="page-title">Characters</h1>
          <p className="page-desc">
            Derived from character cues in the screenplay. Edit names in the
            script to update this list.
          </p>
        </header>

        {characters.length === 0 ? (
          <p className="derived-empty">No speaking characters yet.</p>
        ) : (
          <ul className="derived-list">
            {characters.map((name) => (
              <li key={name} className="derived-row">
                <span className="derived-avatar" aria-hidden>
                  {name.charAt(0)}
                </span>
                <div className="derived-main">
                  <button
                    type="button"
                    className="derived-title-btn"
                    onClick={() => {
                      const id = firstCueId(name)
                      if (!id) return
                      selectElement(id)
                      requestFocus(id)
                      navigate(projectPath(projectId, 'script'))
                    }}
                  >
                    {name}
                  </button>
                  <div className="derived-meta">From script dialogue cues</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
