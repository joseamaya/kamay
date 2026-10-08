import type { ReactNode } from 'react'

import { Button } from './Button'
import type { ButtonProps } from './Button'
import { cn } from './cn'
import { Tooltip } from './Tooltip'

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
    <Tooltip label={label}>
      <Button
        type={type}
        variant={variant}
        size="icon"
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          'aria-pressed:bg-secondary aria-pressed:text-secondary-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  )
}
