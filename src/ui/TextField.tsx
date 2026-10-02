import type { ChangeEvent } from 'react'

import { cn } from './cn'

export interface TextFieldProps {
  label: string
  value: string
  placeholder?: string
  className?: string
  onChange: (value: string) => void
}

export function TextField({ label, value, placeholder, className, onChange }: TextFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <label className={cn('flex flex-col gap-1 text-xs', className)}>
      <span className="text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        className="border-border bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
    </label>
  )
}
