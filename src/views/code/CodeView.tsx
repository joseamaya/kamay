import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

import { generatePython, symbolAtLine } from '../../generator'
import type { EditableValue, GeneratedSymbol } from '../../generator'
import { getMessages } from '../../i18n'
import { translateRuntimeError, translateRuntimeHint } from '../../runtime'
import {
  askPredictionForAttribute,
  CODE_MIN_HEIGHT,
  useActiveScene,
  useCapabilities,
  useEditorStore,
  useProjectStore,
  useRuntimeStore,
} from '../../store'
import type { MemberRef } from '../../store'
import { cn } from '../../ui/cn'
import { LazyCodeEditor } from '../../ui/LazyCodeEditor'
import { findSymbol, symbolMemberRef } from './memberSymbol'

/** The object to select when a symbol has no explicit instance (class members). */
function objectForSymbol(
  scene: { objects: { id: string; name: string; class: string }[] } | null,
  symbol: GeneratedSymbol,
): string | null {
  if (!scene) return null
  if (symbol.objectName) {
    return scene.objects.find((object) => object.name === symbol.objectName)?.id ?? null
  }
  if (symbol.className) {
    return scene.objects.find((object) => object.class === symbol.className)?.id ?? null
  }
  return null
}

const COPY_FEEDBACK_MS = 1500
const RESIZE_STEP = 24
const MAX_HEIGHT_RATIO = 0.7

function maxHeight(): number {
  return typeof window !== 'undefined' ? window.innerHeight * MAX_HEIGHT_RATIO : 600
}

export function CodeView() {
  const messages = getMessages()
  const project = useProjectStore((state) => state.project)
  const activeSceneId = useEditorStore((state) => state.activeSceneId)
  const scene = useActiveScene()
  const capabilities = useCapabilities()
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)
  const setOrderArg = useProjectStore((state) => state.setOrderArg)
  const generation = useMemo(() => generatePython(project, activeSceneId), [project, activeSceneId])
  const files = generation.files

  const codeHeight = useEditorStore((state) => state.codeHeight)
  const setCodeHeight = useEditorStore((state) => state.setCodeHeight)
  const codeCollapsed = useEditorStore((state) => state.codeCollapsed)
  const setCodeCollapsed = useEditorStore((state) => state.setCodeCollapsed)
  const codeFile = useEditorStore((state) => state.codeFile)
  const setCodeFile = useEditorStore((state) => state.setCodeFile)
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  const highlightedMember = useEditorStore((state) => state.highlightedMember)
  const selectObject = useEditorStore((state) => state.selectObject)
  const setHighlightedMember = useEditorStore((state) => state.setHighlightedMember)
  const error = useRuntimeStore((state) => state.error)

  const [copied, setCopied] = useState(false)
  const [editValuesOn, setEditValuesOn] = useState(false)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  const activeFile =
    files.find((file) => file.path === codeFile) ??
    files.find((file) => file.path === 'principal.py') ??
    files[0]

  const selectedObject = scene?.objects.find((object) => object.id === selectedObjectId) ?? null
  const explicitSymbol = highlightedMember
    ? findSymbol(generation.symbols, highlightedMember)
    : undefined
  const derivedMember: MemberRef | null = selectedObject
    ? { kind: 'object', objectName: selectedObject.name }
    : null
  const activeSymbol =
    explicitSymbol ?? (derivedMember ? findSymbol(generation.symbols, derivedMember) : undefined)

  const highlightLines = useMemo(
    () =>
      activeSymbol && activeFile?.path === activeSymbol.file
        ? { from: activeSymbol.lineFrom, to: activeSymbol.lineTo }
        : null,
    [activeSymbol, activeFile?.path],
  )

  useEffect(() => {
    if (codeFile && !files.some((file) => file.path === codeFile)) setCodeFile(null)
  }, [files, codeFile, setCodeFile])

  useEffect(() => {
    if (!explicitSymbol) return
    if (
      files.some((file) => file.path === explicitSymbol.file) &&
      codeFile !== explicitSymbol.file
    ) {
      setCodeFile(explicitSymbol.file)
    }
    setCodeCollapsed(false)
  }, [explicitSymbol, files, codeFile, setCodeFile, setCodeCollapsed])

  useEffect(() => {
    if (!capabilities.editValues) setCodeCollapsed(true)
  }, [capabilities.editValues, setCodeCollapsed])

  useEffect(() => {
    if (!error?.file) return
    if (!files.some((file) => file.path === error.file)) return
    setCodeFile(error.file)
    setCodeCollapsed(false)
  }, [error, files, setCodeFile, setCodeCollapsed])

  const diagnostics = useMemo(() => {
    if (!error?.line || !error.file || error.file !== activeFile?.path) return []
    const summary = translateRuntimeError(error)
    const hint = translateRuntimeHint(error)
    return [{ line: error.line, message: hint ? `${summary} — ${hint}` : summary }]
  }, [error, activeFile?.path])

  const canEditValues = capabilities.editValues && activeFile?.path === 'principal.py'
  const editableValues = canEditValues && editValuesOn ? generation.editableValues : undefined

  const handleEditValue = useCallback(
    (item: EditableValue, next: number | string | boolean) => {
      if (!scene) return
      if (item.kind === 'attribute') {
        const object = scene.objects.find((candidate) => candidate.name === item.objectName)
        if (!object) return
        updateObjectAttributes(scene.id, object.id, { [item.key]: next })
        askPredictionForAttribute(scene, object, item.key, next)
        return
      }
      setOrderArg(scene.id, item.orderIndex, item.key, next)
    },
    [scene, updateObjectAttributes, setOrderArg],
  )

  const handleLineClick = useCallback(
    (line: number) => {
      if (!activeFile) return
      const symbol = symbolAtLine(generation.symbols, activeFile.path, line)
      if (!symbol) return
      const objectId = objectForSymbol(scene, symbol)
      if (objectId) selectObject(objectId)
      const member = symbolMemberRef(symbol)
      if (member) setHighlightedMember(member)
    },
    [activeFile, generation.symbols, scene, selectObject, setHighlightedMember],
  )

  const handleCopy = async () => {
    if (!activeFile) return
    try {
      await navigator.clipboard.writeText(activeFile.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    } catch {
      // Clipboard access can be denied; ignore.
    }
  }

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startY: event.clientY, startHeight: codeHeight }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const next = drag.startHeight - (event.clientY - drag.startY)
    setCodeHeight(Math.min(Math.max(next, CODE_MIN_HEIGHT), maxHeight()))
  }

  const handleResizePointerUp = () => {
    dragRef.current = null
  }

  const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      setCodeHeight(Math.min(codeHeight + RESIZE_STEP, maxHeight()))
      event.preventDefault()
    } else if (event.key === 'ArrowDown') {
      setCodeHeight(Math.max(codeHeight - RESIZE_STEP, CODE_MIN_HEIGHT))
      event.preventDefault()
    }
  }

  return (
    <section
      className="border-border bg-card text-card-foreground flex min-h-0 flex-none flex-col overflow-hidden rounded-lg border"
      style={{ height: codeCollapsed ? undefined : codeHeight }}
    >
      {codeCollapsed ? null : (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={messages.code.resize}
          tabIndex={0}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          onKeyDown={handleResizeKeyDown}
          className="hover:bg-primary/40 focus-visible:bg-primary/50 h-1.5 flex-none cursor-row-resize focus-visible:outline-none"
        />
      )}

      <header className="border-border flex flex-none flex-wrap items-center gap-2 border-b px-3 py-1.5">
        <h2 className="text-sm font-semibold tracking-wide uppercase">{messages.code.title}</h2>
        {activeFile ? (
          <span className="text-muted-foreground font-mono text-xs">{activeFile.path}</span>
        ) : null}
        <div className="flex-1" />

        {canEditValues ? (
          <button
            type="button"
            aria-pressed={editValuesOn}
            onClick={() => setEditValuesOn(!editValuesOn)}
            className={cn(
              'rounded-md px-2 py-0.5 text-xs transition',
              editValuesOn
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {messages.code.editValues}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2 py-0.5 text-xs transition"
        >
          {copied ? messages.code.copied : messages.code.copy}
        </button>
        <button
          type="button"
          aria-expanded={!codeCollapsed}
          onClick={() => setCodeCollapsed(!codeCollapsed)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2 py-0.5 text-xs transition"
        >
          {codeCollapsed ? messages.code.expand : messages.code.collapse}
        </button>
      </header>

      {codeCollapsed ? null : (
        <div className="min-h-0 flex-1">
          {activeFile ? (
            <LazyCodeEditor
              readOnly
              value={activeFile.content}
              ariaLabel={`${messages.code.title}: ${activeFile.path}`}
              diagnostics={diagnostics}
              editableValues={editableValues}
              onEditValue={handleEditValue}
              highlightLines={highlightLines}
              onLineClick={handleLineClick}
            />
          ) : (
            <p className="text-muted-foreground p-4 text-sm">{messages.code.empty}</p>
          )}
        </div>
      )}
    </section>
  )
}
