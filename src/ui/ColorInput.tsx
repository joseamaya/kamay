import type { ChangeEvent } from 'react'

import { cn } from './cn'

export interface ColorInputProps {
  label: string
  value: string
  className?: string
  onChange: (value: string) => void
}

export function ColorInput({ label, value, className, onChange }: ColorInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <label className={cn('flex items-center justify-between gap-2 text-xs', className)}>
      <span className="text-muted-foreground">{label}</span>
      <input
        type="color"
        value={value}
        onChange={handleChange}
        className="border-border h-8 w-12 cursor-pointer rounded-md border bg-transparent"
      />
    </label>
  )
}
