import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { setDiagnostics } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useRef } from 'react'

import { cn } from './cn'
import { toDiagnostics } from './diagnostics'
import type { CodeDiagnostic } from './diagnostics'

const theme = EditorView.theme({
  '&': {
    color: 'var(--color-foreground)',
    backgroundColor: 'var(--color-card)',
    fontSize: '12px',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.5' },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--color-foreground)' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-muted-foreground)',
    border: 'none',
    borderRight: '1px solid var(--color-border)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklch, var(--color-muted) 45%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--color-foreground)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-foreground)' },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in oklch, var(--color-primary) 22%, transparent)',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklch, var(--color-primary) 30%, transparent)',
  },
})

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--color-primary)', fontWeight: '600' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--color-syntax-string)' },
  {
    tag: [tags.comment, tags.lineComment],
    color: 'var(--color-muted-foreground)',
    fontStyle: 'italic',
  },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--color-syntax-number)' },
  {
    tag: [tags.function(tags.variableName), tags.labelName],
    color: 'var(--color-syntax-function)',
  },
  { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--color-syntax-type)' },
  {
    tag: [tags.definition(tags.variableName), tags.variableName],
    color: 'var(--color-foreground)',
  },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: 'var(--color-muted-foreground)' },
  { tag: tags.meta, color: 'var(--color-muted-foreground)' },
])

export interface CodeEditorProps {
  value: string
  onValueChange?: (value: string) => void
  readOnly?: boolean
  ariaLabel?: string
  className?: string
  diagnostics?: CodeDiagnostic[]
}

export default function CodeEditor({
  value,
  onValueChange,
  readOnly = false,
  ariaLabel,
  className,
  diagnostics,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const changeRef = useRef(onValueChange)
  const valueRef = useRef(value)

  useEffect(() => {
    changeRef.current = onValueChange
    valueRef.current = value
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        python(),
        syntaxHighlighting(highlight),
        theme,
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) changeRef.current?.(update.state.doc.toString())
        }),
        EditorView.contentAttributes.of(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      ],
    })

    const view = new EditorView({ state, parent: host })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [readOnly, ariaLabel])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch(setDiagnostics(view.state, toDiagnostics(view.state.doc, diagnostics ?? [])))
  }, [diagnostics, value, readOnly, ariaLabel])

  return <div ref={hostRef} className={cn('h-full overflow-hidden', className)} />
}
