import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  projectPath,
} from '@/navigation/navItems'
import { extractScenes, getScreenplayAnalytics } from '@/screenplay/elementRules'
import { loadProjectBundle } from '@/screenplay/idb'
import {
  PROJECT_FORMAT_LABELS,
  PROJECT_FORMATS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  type Project,
  type ProjectFormat,
  type ProjectStatus,
  type ScriptDocument,
} from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelative(ms: number): string {
  const delta = Date.now() - ms
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  return formatDate(ms)
}

function formatRuntime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `~${h} hr` : `~${h} hr ${m} min`
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const hydrated = useScriptStore((s) => s.hydrated)
  const hydrate = useScriptStore((s) => s.hydrate)
  const projects = useScriptStore((s) => s.projects)
  const activeId = useScriptStore((s) => s.project.id)
  const activeDoc = useScriptStore((s) => s.doc)
  const openProject = useScriptStore((s) => s.openProject)
  const updateProject = useScriptStore((s) => s.updateProject)

  const [bundle, setBundle] = useState<{
    project: Project
    script: ScriptDocument
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!hydrated) void hydrate()
  }, [hydrate, hydrated])

  useEffect(() => {
    if (!hydrated || !projectId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setMissing(false)

      // Prefer live active doc when viewing the open project.
      if (projectId === activeId) {
        const project =
          projects.find((p) => p.id === projectId) ??
          useScriptStore.getState().project
        if (!cancelled) {
          setBundle({ project, script: activeDoc })
          setLoading(false)
        }
        return
      }

      const loaded = await loadProjectBundle(projectId)
      if (cancelled) return
      if (!loaded) {
        setMissing(true)
        setBundle(null)
      } else {
        // Prefer fresher list metadata (status/genre edits) when available.
        const listed = projects.find((p) => p.id === projectId)
        setBundle({
          project: listed ? { ...loaded.project, ...listed } : loaded.project,
          script: loaded.script,
        })
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [hydrated, projectId, activeId, activeDoc, projects])

  const project = bundle?.project ?? null
  const script = bundle?.script ?? null

  const analytics = useMemo(
    () => (script ? getScreenplayAnalytics(script.elements) : null),
    [script],
  )
  const scenes = useMemo(
    () => (script ? extractScenes(script.elements) : []),
    [script],
  )

  const [draftName, setDraftName] = useState('')
  useEffect(() => {
    setDraftName(project?.name ?? '')
  }, [project?.name])

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  if (!hydrated || loading) {
    return (
      <div className="page">
        <div className="page-inner">
          <p className="page-desc">Loading project…</p>
        </div>
      </div>
    )
  }

  if (missing || !project || !script || !analytics) {
    return (
      <div className="page">
        <div className="page-inner">
          <header className="page-hero">
            <p className="page-kicker">
              <Link to="/projects">Projects</Link>
            </p>
            <h1 className="page-title">Project not found</h1>
            <p className="page-desc">
              This project may have been removed from the workspace.
            </p>
            <Link className="detail-back-link" to="/projects">
              ← Back to Projects
            </Link>
          </header>
        </div>
      </div>
    )
  }

  const author =
    project.author.trim() ||
    script.titlePage.authors.trim() ||
    '—'
  const draftLabel =
    script.titlePage.revision.trim() || 'First Draft'
  const lastModified = Math.max(project.updatedAt, script.updatedAt)
  const completion =
    project.targetPages > 0
      ? Math.min(
          100,
          Math.round((analytics.pageCount / project.targetPages) * 100),
        )
      : null
  const coverUrl = project.coverImage.trim()

  const patch = (
    fields: Partial<
      Omit<Project, 'id' | 'scriptId' | 'createdAt' | 'updatedAt'>
    >,
  ) => updateProject(project.id, fields)

  const openStory = async (view: 'script' | 'outline' | 'characters' | 'locations') => {
    if (project.id !== activeId) await openProject(project.id)
    navigate(projectPath(project.id, view))
  }

  const recentScenes = scenes.slice(-5).reverse()

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero detail-hero project-detail-hero">
          <p className="page-kicker">
            <Link to="/projects">Projects</Link>
          </p>

          <div className="project-cover-row">
            <div className="project-cover" aria-hidden>
              {coverUrl ? (
                <img src={coverUrl} alt="" className="project-cover-img" />
              ) : (
                <div className="project-cover-placeholder">
                  <span>{project.name.charAt(0) || 'P'}</span>
                </div>
              )}
            </div>
            <div className="project-cover-main">
              <input
                className="detail-name-input"
                value={draftName}
                aria-label="Project title"
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  const next = draftName.trim()
                  if (!next) {
                    setDraftName(project.name)
                    return
                  }
                  if (next !== project.name) patch({ name: next })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
              <p className="page-desc">
                Central command for this screenplay — stats refresh from the
                script; goals and status stay with the project.
              </p>
              <div className="project-hero-meta">
                <span className="project-status-pill">
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
                <span>{PROJECT_FORMAT_LABELS[project.format]}</span>
                {project.genre.trim() ? <span>{project.genre}</span> : null}
              </div>
            </div>
          </div>
        </header>

        <section className="detail-section" aria-labelledby="proj-actions">
          <h2 id="proj-actions" className="detail-section-title">
            Open workspace
          </h2>
          <div className="placeholder-grid">
            {(
              [
                ['script', 'Script', 'Continue writing the screenplay'],
                ['outline', 'Outline', 'Scene list and structure'],
                ['characters', 'Characters', 'Cast derived from cues'],
                ['locations', 'Locations', 'Places from scene headings'],
              ] as const
            ).map(([view, title, desc]) => (
              <button
                key={view}
                type="button"
                className="placeholder-block placeholder-block--action"
                onClick={() => void openStory(view)}
              >
                <h3>{title}</h3>
                <p>{desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="detail-section" aria-labelledby="proj-overview">
          <h2 id="proj-overview" className="detail-section-title">
            Project overview
          </h2>
          <dl className="detail-stat-grid">
            <div className="detail-stat">
              <dt>Author</dt>
              <dd>{author}</dd>
            </div>
            <div className="detail-stat">
              <dt>Screenplay title</dt>
              <dd>{script.title.trim() || 'Untitled Screenplay'}</dd>
            </div>
            <div className="detail-stat">
              <dt>Created</dt>
              <dd>{formatDate(project.createdAt)}</dd>
            </div>
            <div className="detail-stat">
              <dt>Last modified</dt>
              <dd>{formatDate(lastModified)}</dd>
            </div>
            <div className="detail-stat">
              <dt>Current draft</dt>
              <dd>{draftLabel}</dd>
            </div>
            <div className="detail-stat">
              <dt>Status</dt>
              <dd>{PROJECT_STATUS_LABELS[project.status]}</dd>
            </div>
            <div className="detail-stat">
              <dt>Page count</dt>
              <dd>{analytics.pageCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Est. runtime</dt>
              <dd>{formatRuntime(analytics.estimatedRuntimeMinutes)}</dd>
            </div>
            <div className="detail-stat">
              <dt>Word count</dt>
              <dd>{analytics.wordCount.toLocaleString()}</dd>
            </div>
            <div className="detail-stat">
              <dt>Completion</dt>
              <dd>
                {completion == null
                  ? 'Set a page goal'
                  : `${completion}% of ${project.targetPages} pages`}
              </dd>
            </div>
          </dl>
        </section>

        <section className="detail-section" aria-labelledby="proj-analytics">
          <h2 id="proj-analytics" className="detail-section-title">
            Screenplay analytics
          </h2>
          <dl className="detail-stat-grid">
            <div className="detail-stat">
              <dt>Total scenes</dt>
              <dd>{analytics.sceneCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Acts</dt>
              <dd>
                {analytics.actCount == null
                  ? '—'
                  : analytics.actCount}
              </dd>
            </div>
            <div className="detail-stat">
              <dt>Sequences</dt>
              <dd>
                {analytics.sequenceCount == null
                  ? '—'
                  : analytics.sequenceCount}
              </dd>
            </div>
            <div className="detail-stat">
              <dt>Characters</dt>
              <dd>{analytics.characterCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Locations</dt>
              <dd>{analytics.locationCount}</dd>
            </div>
            <div className="detail-stat">
              <dt>Dialogue</dt>
              <dd>{analytics.dialoguePercent}%</dd>
            </div>
            <div className="detail-stat">
              <dt>Action</dt>
              <dd>{analytics.actionPercent}%</dd>
            </div>
            <div className="detail-stat">
              <dt>Avg. scene length</dt>
              <dd>
                {analytics.averageSceneLengthLines
                  ? `${analytics.averageSceneLengthLines} lines`
                  : '—'}
              </dd>
            </div>
          </dl>
          {(analytics.actCount == null || analytics.sequenceCount == null) && (
            <p className="detail-empty detail-hint">
              Acts and sequences appear when headings include ACT / SEQUENCE
              markers.
            </p>
          )}
        </section>

        <section className="detail-section" aria-labelledby="proj-meta">
          <h2 id="proj-meta" className="detail-section-title">
            Project settings
          </h2>
          <div className="detail-fields">
            <label className="detail-field">
              <span>Author</span>
              <input
                type="text"
                value={project.author}
                placeholder={
                  script.titlePage.authors.trim() || 'Writer name'
                }
                onChange={(e) => patch({ author: e.target.value })}
              />
            </label>
            <label className="detail-field">
              <span>Genre</span>
              <input
                type="text"
                value={project.genre}
                placeholder="Drama, Thriller, Comedy…"
                onChange={(e) => patch({ genre: e.target.value })}
              />
            </label>
            <label className="detail-field">
              <span>Format</span>
              <select
                value={project.format}
                onChange={(e) =>
                  patch({ format: e.target.value as ProjectFormat })
                }
              >
                {PROJECT_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {PROJECT_FORMAT_LABELS[format]}
                  </option>
                ))}
              </select>
            </label>
            <label className="detail-field">
              <span>Status</span>
              <select
                value={project.status}
                onChange={(e) =>
                  patch({ status: e.target.value as ProjectStatus })
                }
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="detail-field">
              <span>Cover image URL</span>
              <input
                type="url"
                value={project.coverImage}
                placeholder="https://… (optional)"
                onChange={(e) => patch({ coverImage: e.target.value })}
              />
            </label>
            <label className="detail-field">
              <span>Target pages</span>
              <input
                type="number"
                min={0}
                value={project.targetPages || ''}
                placeholder="e.g. 110"
                onChange={(e) => {
                  const n = Number(e.target.value)
                  patch({
                    targetPages:
                      Number.isFinite(n) && n > 0 ? Math.floor(n) : 0,
                  })
                }}
              />
            </label>
            <label className="detail-field detail-field--block">
              <span>Writing goals</span>
              <textarea
                rows={3}
                value={project.writingGoals}
                placeholder="Daily pages, finish draft by…, tone targets…"
                onChange={(e) => patch({ writingGoals: e.target.value })}
              />
            </label>
            <label className="detail-field detail-field--block">
              <span>Project notes</span>
              <textarea
                rows={3}
                value={project.notes}
                placeholder="Logline reminders, producer notes, research links…"
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="proj-activity">
          <h2 id="proj-activity" className="detail-section-title">
            Recent activity
          </h2>
          <ul className="project-activity-list">
            <li>
              <span className="project-activity-label">Script updated</span>
              <span className="project-activity-meta">
                {formatRelative(script.updatedAt)}
              </span>
            </li>
            <li>
              <span className="project-activity-label">Project settings</span>
              <span className="project-activity-meta">
                {formatRelative(project.updatedAt)}
              </span>
            </li>
            <li>
              <span className="project-activity-label">Comments</span>
              <span className="project-activity-meta">
                {script.comments.length} in script
              </span>
            </li>
            <li>
              <span className="project-activity-label">Character dossiers</span>
              <span className="project-activity-meta">
                {script.characterProfiles.length} saved
              </span>
            </li>
          </ul>

          {recentScenes.length > 0 ? (
            <>
              <h3 className="detail-subsection-title">Latest scenes</h3>
              <ul className="detail-scene-list">
                {recentScenes.map((scene) => (
                  <li key={scene.id}>
                    <button
                      type="button"
                      className="detail-scene-btn"
                      onClick={() => {
                        void (async () => {
                          if (project.id !== activeId) {
                            await openProject(project.id)
                          }
                          useScriptStore.getState().revealElement(scene.id)
                          navigate(projectPath(project.id, 'script'))
                        })()
                      }}
                    >
                      <span className="detail-scene-num">{scene.number}</span>
                      <span className="detail-scene-heading">
                        {scene.heading}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="detail-empty">No scenes in the script yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

