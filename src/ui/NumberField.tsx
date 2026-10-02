import type { ChangeEvent } from 'react'

import { cn } from './cn'

export interface NumberFieldProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  className?: string
  onChange: (value: number) => void
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  className,
  onChange,
}: NumberFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value)
    if (Number.isFinite(next)) onChange(next)
  }

  return (
    <label className={cn('flex flex-col gap-1 text-xs', className)}>
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="border-border bg-background focus-visible:ring-ring h-8 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
    </label>
  )
}
