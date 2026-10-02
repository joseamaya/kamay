import { lazy, Suspense } from 'react'

import { cn } from './cn'
import type { CodeEditorProps } from './CodeEditor'

const CodeEditor = lazy(() => import('./CodeEditor'))

function Fallback({ value, onValueChange, readOnly, ariaLabel, className }: CodeEditorProps) {
  if (readOnly) {
    return (
      <div className={cn('h-full overflow-auto', className)} aria-label={ariaLabel}>
        <pre className="px-3 py-3 font-mono text-xs leading-5 whitespace-pre">{value}</pre>
      </div>
    )
  }

  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      spellCheck={false}
      className={cn(
        'border-border bg-card h-full w-full resize-none rounded-md border p-2 font-mono text-xs focus-visible:outline-none',
        className,
      )}
    />
  )
}

export function LazyCodeEditor(props: CodeEditorProps) {
  return (
    <Suspense fallback={<Fallback {...props} />}>
      <CodeEditor {...props} />
    </Suspense>
  )
}
