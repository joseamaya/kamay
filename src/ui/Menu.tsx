import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { Button } from './Button'
import { cn } from './cn'

export interface MenuProps {
  label: string
  trigger?: ReactNode
  /** Side the dropdown aligns to. Defaults to the trigger's right edge. */
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

export function Menu({ label, trigger, align = 'right', children }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger ?? label}
      </Button>
      {open ? (
        <div
          role="menu"
          className={cn(
            'border-border bg-card text-card-foreground absolute z-40 mt-1 flex w-48 flex-col gap-0.5 rounded-md border p-1 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export interface MenuItemProps {
  children: ReactNode
  disabled?: boolean
  pressed?: boolean
  onClick: () => void
}

export function MenuItem({ children, disabled, pressed, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'hover:bg-muted focus-visible:bg-muted rounded-md px-2 py-1.5 text-left text-sm transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      {children}
    </button>
  )
}
