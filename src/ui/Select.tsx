import type { ChangeEvent } from 'react'

import { cn } from './cn'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label?: string
  ariaLabel?: string
  value: string
  options: SelectOption[]
  className?: string
  onChange: (value: string) => void
}

export function Select({ label, ariaLabel, value, options, className, onChange }: SelectProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <label className={cn('flex flex-col gap-1 text-xs', className)}>
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={handleChange}
        className="border-border bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
