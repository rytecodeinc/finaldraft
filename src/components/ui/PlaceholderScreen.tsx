import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface PlaceholderCard {
  title: string
  description: string
  icon: LucideIcon
  /** When set, the card navigates to this path on click. */
  to?: string
  onClick?: () => void
}

interface PlaceholderScreenProps {
  kicker: string
  title: string
  description: string
  cards?: PlaceholderCard[]
  children?: ReactNode
}

export function PlaceholderScreen({
  kicker,
  title,
  description,
  cards = [],
  children,
}: PlaceholderScreenProps) {
  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-hero">
          <p className="page-kicker">{kicker}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-desc">{description}</p>
        </header>

        {children}

        {cards.length > 0 ? (
          <div className="placeholder-grid">
            {cards.map((card) => {
              const Icon = card.icon
              const body = (
                <>
                  <div className="placeholder-icon">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </>
              )

              if (card.to) {
                return (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="placeholder-block placeholder-block--action"
                  >
                    {body}
                  </Link>
                )
              }

              if (card.onClick) {
                return (
                  <button
                    key={card.title}
                    type="button"
                    className="placeholder-block placeholder-block--action"
                    onClick={card.onClick}
                  >
                    {body}
                  </button>
                )
              }

              return (
                <article key={card.title} className="placeholder-block">
                  {body}
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
