import type { ReactNode } from 'react'

interface PanelHeaderProps {
  title: string
  actions?: ReactNode
}

export function PanelHeader({ title, actions }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {actions ? <div className="toolbar-group">{actions}</div> : null}
    </div>
  )
}
