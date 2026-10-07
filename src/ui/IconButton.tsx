import type { ReactNode } from 'react'

import { Button } from './Button'
import type { ButtonProps } from './Button'
import { cn } from './cn'

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'size' | 'aria-label'> {
  label: string
  children: ReactNode
  pressed?: boolean
}

export function IconButton({
  label,
  children,
  pressed,
  variant = 'ghost',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size="icon"
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'group relative aria-pressed:bg-secondary aria-pressed:text-secondary-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className="border-border bg-card text-card-foreground pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </Button>
  )
}
