import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { characterPath } from '@/navigation/navItems'
import { characterCueBaseName } from '@/screenplay/elementRules'
import { useScriptStore } from '@/stores/scriptStore'

export function CharactersPage() {
  const navigate = useNavigate()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const elements = useScriptStore((s) => s.doc.elements)
  const getCharacters = useScriptStore((s) => s.getCharacters)
  const renameCharacter = useScriptStore((s) => s.renameCharacter)

  const characters = useMemo(() => getCharacters(), [getCharacters, elements])
  const [editingName, setEditingName] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const cueCount = (name: string) => {
    const upper = name.toUpperCase()
    return elements.filter(
      (el) =>
        el.type === 'character' && characterCueBaseName(el.text) === upper,
    ).length
  }

  const commitRename = (from: string) => {
    const next = draft.trim().toUpperCase()
    setEditingName(null)
    if (!next || next === from) return
    renameCharacter(from, next)
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{projectName}</p>
          <h1 className="page-title">Characters</h1>
          <p className="page-desc">
            Derived from character cues. Open a character for stats, notes, and
            production info.
          </p>
        </header>

        {characters.length === 0 ? (
          <p className="derived-empty">No speaking characters yet.</p>
        ) : (
          <ul className="derived-list">
            {characters.map((name) => {
              const editing = editingName === name
              const count = cueCount(name)
              return (
                <li key={name} className="derived-row">
                  <span className="derived-avatar" aria-hidden>
                    {name.charAt(0)}
                  </span>
                  <div className="derived-main">
                    {editing ? (
                      <input
                        className="derived-input"
                        value={draft}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value.toUpperCase())}
                        onBlur={() => commitRename(name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                          }
                          if (e.key === 'Escape') {
                            setEditingName(null)
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="derived-title-btn"
                        onClick={() => navigate(characterPath(projectId, name))}
                        title="Open character detail"
                      >
                        {name}
                      </button>
                    )}
                    <div className="derived-meta">
                      {count} cue{count === 1 ? '' : 's'} in script
                    </div>
                  </div>
                  {!editing ? (
                    <div className="derived-actions">
                      <button
                        type="button"
                        className="derived-icon-btn"
                        aria-label={`Rename ${name}`}
                        title="Rename character"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingName(name)
                          setDraft(name)
                        }}
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
