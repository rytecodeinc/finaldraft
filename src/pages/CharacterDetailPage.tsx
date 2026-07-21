import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  characterPath,
  projectPath,
} from '@/navigation/navItems'
import { getCharacterAppearance } from '@/screenplay/elementRules'
import { useScriptStore } from '@/stores/scriptStore'

function formatSpeakingTime(seconds: number): string {
  if (seconds <= 0) return '—'
  if (seconds < 60) return `~${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rem = seconds % 60
  return rem === 0 ? `~${minutes}m` : `~${minutes}m ${rem}s`
}

export function CharacterDetailPage() {
  const navigate = useNavigate()
  const { characterName: rawParam } = useParams<{ characterName: string }>()
  const projectId = useScriptStore((s) => s.project.id)
  const projectName = useScriptStore((s) => s.project.name)
  const elements = useScriptStore((s) => s.doc.elements)
  const profiles = useScriptStore((s) => s.doc.characterProfiles)
  const getScenes = useScriptStore((s) => s.getScenes)
  const renameCharacter = useScriptStore((s) => s.renameCharacter)
  const updateCharacterProfile = useScriptStore((s) => s.updateCharacterProfile)
  const ensureCharacterProfile = useScriptStore((s) => s.ensureCharacterProfile)
  const selectDirectory = useScriptStore((s) => s.selectDirectory)
  const revealElement = useScriptStore((s) => s.revealElement)
  const getCharacters = useScriptStore((s) => s.getCharacters)

  const name = useMemo(() => {
    if (!rawParam) return null
    try {
      return decodeURIComponent(rawParam).trim().toUpperCase()
    } catch {
      return rawParam.trim().toUpperCase()
    }
  }, [rawParam])

  const characters = useMemo(() => getCharacters(), [getCharacters, elements])
  const totalScenes = useMemo(() => getScenes().length, [getScenes, elements])

  const appearance = useMemo(
    () => (name ? getCharacterAppearance(elements, name) : null),
    [elements, name],
  )

  const profile = useMemo(() => {
    if (!name) return null
    return (
      profiles.find((p) => p.name === name) ?? null
    )
  }, [profiles, name])

  const [draftName, setDraftName] = useState(name ?? '')

  useEffect(() => {
    setDraftName(name ?? '')
  }, [name])

  useEffect(() => {
    if (!name) return
    if (!characters.includes(name)) return
    selectDirectory({ kind: 'character', name })
    ensureCharacterProfile(name)
  }, [name, characters, selectDirectory, ensureCharacterProfile])

  if (!name) {
    return <Navigate to={projectPath(projectId, 'characters')} replace />
  }

  if (!characters.includes(name) || !appearance) {
    return (
      <div className="page">
        <div className="page-inner">
          <header className="page-hero">
            <p className="page-kicker">{projectName}</p>
            <h1 className="page-title">Character not found</h1>
            <p className="page-desc">
              No speaking cues match “{name}” in this script.
            </p>
            <Link
              className="detail-back-link"
              to={projectPath(projectId, 'characters')}
            >
              ← Back to Characters
            </Link>
          </header>
        </div>
      </div>
    )
  }

  const dossier = profile ?? {
    name,
    aliases: '',
    role: '',
    ageRange: '',
    gender: '',
    castingNotes: '',
    wardrobeNotes: '',
    relationshipNotes: '',
    arcNotes: '',
    notes: '',
    productionNotes: '',
  }

  const openScene = (elementId: string) => {
    revealElement(elementId)
    navigate(projectPath(projectId, 'script'))
  }

  const commitRename = () => {
    const next = draftName.trim().toUpperCase()
    if (!next || next === name) {
      setDraftName(name)
      return
    }
    renameCharacter(name, next)
    navigate(characterPath(projectId, next), { replace: true })
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero detail-hero">
          <p className="page-kicker">
            <Link to={projectPath(projectId, 'characters')}>Characters</Link>
          </p>
          <div className="detail-name-row">
            <input
              className="detail-name-input"
              value={draftName}
              aria-label="Character name"
              onChange={(e) => setDraftName(e.target.value.toUpperCase())}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
          </div>
          <p className="page-desc">
            Script-derived stats update as you write. Notes and production
            fields stay with this character dossier.
          </p>
        </header>

        <section className="detail-section" aria-labelledby="char-stats">
          <h2 id="char-stats" className="detail-section-title">
            Script stats
          </h2>
          <dl className="detail-stat-grid">
            <div className="detail-stat">
              <dt>Appearances</dt>
              <dd>
                {appearance.cueCount} cue
                {appearance.cueCount === 1 ? '' : 's'}
              </dd>
            </div>
            <div className="detail-stat">
              <dt>Lines</dt>
              <dd>{appearance.dialogueCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Dialogue count</dt>
              <dd>{appearance.dialogueCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Word count</dt>
              <dd>{appearance.wordCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Est. speaking time</dt>
              <dd>{formatSpeakingTime(appearance.estimatedSpeakingSeconds)}</dd>
            </div>
            <div className="detail-stat">
              <dt>Scenes</dt>
              <dd>
                {appearance.scenes.length} of {totalScenes}
              </dd>
            </div>
            <div className="detail-stat">
              <dt>First appearance</dt>
              <dd>
                {appearance.firstScene ? (
                  <button
                    type="button"
                    className="detail-inline-link"
                    onClick={() =>
                      appearance.firstCueId &&
                      openScene(appearance.firstCueId)
                    }
                  >
                    Sc. {appearance.firstScene.number} ·{' '}
                    {appearance.firstScene.heading}
                  </button>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="detail-stat">
              <dt>Last appearance</dt>
              <dd>
                {appearance.lastScene ? (
                  <button
                    type="button"
                    className="detail-inline-link"
                    onClick={() =>
                      appearance.lastCueId && openScene(appearance.lastCueId)
                    }
                  >
                    Sc. {appearance.lastScene.number} ·{' '}
                    {appearance.lastScene.heading}
                  </button>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="detail-section" aria-labelledby="char-identity">
          <h2 id="char-identity" className="detail-section-title">
            Identity
          </h2>
          <div className="detail-fields">
            <label className="detail-field">
              <span>Aliases</span>
              <input
                type="text"
                value={dossier.aliases}
                placeholder="e.g. MAYA CHEN, M (nickname)"
                onChange={(e) =>
                  updateCharacterProfile(name, { aliases: e.target.value })
                }
              />
            </label>
            <label className="detail-field">
              <span>Role</span>
              <input
                type="text"
                value={dossier.role}
                placeholder="Lead / Supporting / Cameo"
                onChange={(e) =>
                  updateCharacterProfile(name, { role: e.target.value })
                }
              />
            </label>
            <label className="detail-field">
              <span>Age range</span>
              <input
                type="text"
                value={dossier.ageRange}
                placeholder="e.g. 30s"
                onChange={(e) =>
                  updateCharacterProfile(name, { ageRange: e.target.value })
                }
              />
            </label>
            <label className="detail-field">
              <span>Gender / presentation</span>
              <input
                type="text"
                value={dossier.gender}
                placeholder="Optional"
                onChange={(e) =>
                  updateCharacterProfile(name, { gender: e.target.value })
                }
              />
            </label>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="char-scenes">
          <h2 id="char-scenes" className="detail-section-title">
            Scene list
          </h2>
          {appearance.scenes.length === 0 ? (
            <p className="detail-empty">No scene context yet.</p>
          ) : (
            <ul className="detail-scene-list">
              {appearance.scenes.map((scene) => (
                <li key={scene.id}>
                  <button
                    type="button"
                    className="detail-scene-btn"
                    onClick={() => openScene(scene.id)}
                  >
                    <span className="detail-scene-num">{scene.number}</span>
                    <span className="detail-scene-heading">{scene.heading}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section" aria-labelledby="char-locations">
          <h2 id="char-locations" className="detail-section-title">
            Associated locations
          </h2>
          {appearance.locations.length === 0 ? (
            <p className="detail-empty">No locations derived yet.</p>
          ) : (
            <ul className="detail-chip-list">
              {appearance.locations.map((loc) => (
                <li key={loc}>{loc}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section" aria-labelledby="char-rels">
          <h2 id="char-rels" className="detail-section-title">
            Relationships
          </h2>
          {appearance.coAppearances.length === 0 ? (
            <p className="detail-empty">
              No shared scenes with other speaking characters yet.
            </p>
          ) : (
            <ul className="detail-rel-list">
              {appearance.coAppearances.map((rel) => (
                <li key={rel.name}>
                  <Link
                    className="detail-inline-link"
                    to={characterPath(projectId, rel.name)}
                  >
                    {rel.name}
                  </Link>
                  <span className="detail-rel-meta">
                    {rel.sharedScenes} shared scene
                    {rel.sharedScenes === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <label className="detail-field detail-field--block">
            <span>Relationship notes</span>
            <textarea
              rows={3}
              value={dossier.relationshipNotes}
              placeholder="How this character relates to others…"
              onChange={(e) =>
                updateCharacterProfile(name, {
                  relationshipNotes: e.target.value,
                })
              }
            />
          </label>
        </section>

        <section className="detail-section" aria-labelledby="char-arc">
          <h2 id="char-arc" className="detail-section-title">
            Character arc
          </h2>
          <label className="detail-field detail-field--block">
            <span>Arc progression</span>
            <textarea
              rows={4}
              value={dossier.arcNotes}
              placeholder="Want → Need → Flaw → Change…"
              onChange={(e) =>
                updateCharacterProfile(name, { arcNotes: e.target.value })
              }
            />
          </label>
        </section>

        <section className="detail-section" aria-labelledby="char-notes">
          <h2 id="char-notes" className="detail-section-title">
            Notes
          </h2>
          <label className="detail-field detail-field--block">
            <span>Writer notes</span>
            <textarea
              rows={5}
              value={dossier.notes}
              placeholder="Backstory, voice, research…"
              onChange={(e) =>
                updateCharacterProfile(name, { notes: e.target.value })
              }
            />
          </label>
        </section>

        <section className="detail-section" aria-labelledby="char-prod">
          <h2 id="char-prod" className="detail-section-title">
            Production
          </h2>
          <div className="detail-fields">
            <label className="detail-field detail-field--block">
              <span>Casting notes</span>
              <textarea
                rows={3}
                value={dossier.castingNotes}
                placeholder="Look, vibe, references…"
                onChange={(e) =>
                  updateCharacterProfile(name, {
                    castingNotes: e.target.value,
                  })
                }
              />
            </label>
            <label className="detail-field detail-field--block">
              <span>Wardrobe notes</span>
              <textarea
                rows={3}
                value={dossier.wardrobeNotes}
                placeholder="Costume / look progression…"
                onChange={(e) =>
                  updateCharacterProfile(name, {
                    wardrobeNotes: e.target.value,
                  })
                }
              />
            </label>
            <label className="detail-field detail-field--block">
              <span>Other production info</span>
              <textarea
                rows={3}
                value={dossier.productionNotes}
                placeholder="Stunts, dialect, availability…"
                onChange={(e) =>
                  updateCharacterProfile(name, {
                    productionNotes: e.target.value,
                  })
                }
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
