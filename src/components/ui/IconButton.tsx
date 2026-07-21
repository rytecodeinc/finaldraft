import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
}

export function IconButton({
  label,
  active = false,
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-btn ${size === 'sm' ? 'icon-btn--sm' : ''} ${active ? 'icon-btn--active' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
