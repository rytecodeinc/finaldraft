import type { TitlePageInfo } from '@/screenplay/types'
import { useScriptStore } from '@/stores/scriptStore'

function TitleField({
  id,
  label,
  value,
  multiline = false,
  className = '',
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  multiline?: boolean
  className?: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className={`title-page-field ${className}`.trim()} htmlFor={id}>
      <span className="title-page-field-label">{label}</span>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

export function TitlePage() {
  // Subscribe to each field so inspector edits always re-render the page.
  const title = useScriptStore((s) => s.doc.titlePage.title)
  const credit = useScriptStore((s) => s.doc.titlePage.credit)
  const authors = useScriptStore((s) => s.doc.titlePage.authors)
  const basedOn = useScriptStore((s) => s.doc.titlePage.basedOn)
  const contact = useScriptStore((s) => s.doc.titlePage.contact)
  const copyright = useScriptStore((s) => s.doc.titlePage.copyright)
  const draftDate = useScriptStore((s) => s.doc.titlePage.draftDate)
  const revision = useScriptStore((s) => s.doc.titlePage.revision)
  const updateTitlePage = useScriptStore((s) => s.updateTitlePage)

  const set =
    (key: keyof TitlePageInfo) =>
    (value: string) =>
      updateTitlePage({ [key]: value })

  return (
    <section className="script-page script-page--title" aria-label="Title page">
      <div className="title-page-layout">
        <div className="title-page-top">
          <TitleField
            id="tp-revision"
            label="Revision"
            value={revision}
            onChange={set('revision')}
            placeholder="First Draft"
            className="title-page-revision"
          />
          <TitleField
            id="tp-date"
            label="Draft date"
            value={draftDate}
            onChange={set('draftDate')}
            className="title-page-date"
          />
        </div>

        <div className="title-page-center">
          <TitleField
            id="tp-title"
            label="Title"
            value={title}
            onChange={set('title')}
            placeholder="UNTITLED SCREENPLAY"
            className="title-page-title"
          />
          <TitleField
            id="tp-credit"
            label="Credit"
            value={credit}
            onChange={set('credit')}
            placeholder="Written by"
            className="title-page-credit"
          />
          <TitleField
            id="tp-authors"
            label="Author(s)"
            value={authors}
            onChange={set('authors')}
            placeholder="Writer Name"
            className="title-page-authors"
          />
          <TitleField
            id="tp-based"
            label="Based on"
            value={basedOn}
            onChange={set('basedOn')}
            placeholder="Based on the novel by…"
            className="title-page-based"
          />
        </div>

        <div className="title-page-bottom">
          <TitleField
            id="tp-contact"
            label="Contact"
            value={contact}
            onChange={set('contact')}
            multiline
            placeholder={'Name\nAddress\nPhone / Email'}
            className="title-page-contact"
          />
          <TitleField
            id="tp-copyright"
            label="Copyright"
            value={copyright}
            onChange={set('copyright')}
            placeholder="© Year"
            className="title-page-copyright"
          />
        </div>
      </div>
    </section>
  )
}
