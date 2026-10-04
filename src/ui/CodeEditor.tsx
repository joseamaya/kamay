import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { setDiagnostics } from '@codemirror/lint'
import { EditorState, StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  WidgetType,
} from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { useEffect, useRef } from 'react'

import { pyLiteral } from '../generator'
import type { EditableValue } from '../generator'
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
  '.cm-kamay-value': {
    fontFamily: 'var(--font-mono)',
    fontSize: 'inherit',
    lineHeight: '1.4',
    color: 'var(--color-syntax-string)',
    backgroundColor: 'color-mix(in oklch, var(--color-primary) 14%, transparent)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    padding: '0 3px',
    width: 'auto',
    minWidth: '3ch',
    maxWidth: '20ch',
  },
  '.cm-kamay-value:focus': {
    outline: 'none',
    borderColor: 'var(--color-ring)',
    backgroundColor: 'color-mix(in oklch, var(--color-primary) 22%, transparent)',
  },
  '.cm-kamay-value-string': { color: 'var(--color-syntax-string)' },
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

function displayValue(item: EditableValue): string {
  if (typeof item.value === 'string') return item.value
  if (typeof item.value === 'boolean') return item.value ? 'true' : 'false'
  return String(item.value)
}

function parseEditedValue(item: EditableValue, input: string): number | string | boolean | null {
  if (typeof item.value === 'string') return input
  if (typeof item.value === 'number') {
    const parsed = Number(input.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  const normalized = input.trim().toLowerCase()
  if (normalized === 'true' || normalized === 'verdadero') return true
  if (normalized === 'false' || normalized === 'falso') return false
  return null
}

class EditableValueWidget extends WidgetType {
  readonly item: EditableValue
  readonly onEdit: (item: EditableValue, next: number | string | boolean) => void

  constructor(
    item: EditableValue,
    onEdit: (item: EditableValue, next: number | string | boolean) => void,
  ) {
    super()
    this.item = item
    this.onEdit = onEdit
  }

  eq(other: EditableValueWidget): boolean {
    return (
      other.item.from === this.item.from &&
      other.item.to === this.item.to &&
      other.item.raw === this.item.raw &&
      other.item.value === this.item.value
    )
  }

  toDOM(view: EditorView): HTMLElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'cm-kamay-value'
    input.value = displayValue(this.item)
    input.spellcheck = false
    input.setAttribute('aria-label', this.item.key)

    const commit = () => {
      const parsed = parseEditedValue(this.item, input.value)
      if (parsed === null) {
        input.value = displayValue(this.item)
        return
      }
      const raw = pyLiteral(parsed)
      if (raw === this.item.raw) return
      view.dispatch({ changes: { from: this.item.from, to: this.item.to, insert: raw } })
      this.onEdit(this.item, parsed)
    }

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commit()
        input.blur()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        input.value = displayValue(this.item)
        input.blur()
      }
    })
    input.addEventListener('blur', commit)

    if (typeof this.item.value === 'string') {
      const wrapper = document.createElement('span')
      wrapper.className = 'cm-kamay-value-string'
      const open = document.createElement('span')
      open.textContent = '"'
      open.setAttribute('aria-hidden', 'true')
      const close = document.createElement('span')
      close.textContent = '"'
      close.setAttribute('aria-hidden', 'true')
      wrapper.append(open, input, close)
      return wrapper
    }

    return input
  }
}

type ValueEdit = (item: EditableValue, next: number | string | boolean) => void

const setEditableValues = StateEffect.define<{ values: EditableValue[]; onEdit: ValueEdit }>()

const editableValuesField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = decorations.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (effect.is(setEditableValues)) {
        const { values, onEdit } = effect.value
        const ranges = values
          .filter(
            (item) =>
              item.from >= 0 && item.to <= transaction.state.doc.length && item.from < item.to,
          )
          .map((item) =>
            Decoration.replace({ widget: new EditableValueWidget(item, onEdit) }).range(
              item.from,
              item.to,
            ),
          )
        next = Decoration.set(ranges, true)
      }
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

export interface CodeEditorProps {
  value: string
  onValueChange?: (value: string) => void
  readOnly?: boolean
  ariaLabel?: string
  className?: string
  diagnostics?: CodeDiagnostic[]
  editableValues?: EditableValue[]
  onEditValue?: (item: EditableValue, next: number | string | boolean) => void
}

export default function CodeEditor({
  value,
  onValueChange,
  readOnly = false,
  ariaLabel,
  className,
  diagnostics,
  editableValues,
  onEditValue,
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
        editableValuesField,
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
    view.dispatch({
      effects: setEditableValues.of({
        values: editableValues ?? [],
        onEdit: onEditValue ?? (() => {}),
      }),
    })
  }, [editableValues, value, readOnly, ariaLabel, onEditValue])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch(setDiagnostics(view.state, toDiagnostics(view.state.doc, diagnostics ?? [])))
  }, [diagnostics, value, readOnly, ariaLabel])

  return <div ref={hostRef} className={cn('h-full overflow-hidden', className)} />
}
