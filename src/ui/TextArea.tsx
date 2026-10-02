import type { ChangeEvent, TextareaHTMLAttributes } from 'react'

import { cn } from './cn'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  value: string
  onValueChange: (value: string) => void
}

export function TextArea({ label, value, onValueChange, className, ...props }: TextAreaProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(event.target.value)
  }

  return (
    <label className={cn('flex flex-col gap-1 text-xs', className)}>
      <span className="text-muted-foreground">{label}</span>
      <textarea
        {...props}
        value={value}
        onChange={handleChange}
        spellCheck={false}
        className="border-border bg-background focus-visible:ring-ring min-h-20 w-full resize-y rounded-md border p-2 font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
      />
    </label>
  )
}
