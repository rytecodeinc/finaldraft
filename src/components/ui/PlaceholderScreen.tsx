import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PlaceholderScreenProps {
  kicker: string
  title: string
  description: string
  cards?: { title: string; description: string; icon: LucideIcon }[]
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
              return (
                <article key={card.title} className="placeholder-block">
                  <div className="placeholder-icon">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
