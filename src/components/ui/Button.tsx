import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle'
  children: ReactNode
}

export function Button({
  variant = 'subtle',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
