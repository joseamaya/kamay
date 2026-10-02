import type { ChangeEvent } from 'react'

import { cn } from './cn'

export interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  className?: string
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 1, className, onChange }: SliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value))
  }

  return (
    <label className={cn('flex flex-col gap-1 text-xs', className)}>
      <span className="text-muted-foreground flex justify-between">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="accent-primary h-8"
      />
    </label>
  )
}
