import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

import { generatePython } from '../../generator'
import { getMessages } from '../../i18n'
import { translateRuntimeError } from '../../runtime'
import { CODE_MIN_HEIGHT, useEditorStore, useProjectStore, useRuntimeStore } from '../../store'
import { cn } from '../../ui/cn'
import { LazyCodeEditor } from '../../ui/LazyCodeEditor'

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
  const files = useMemo(
    () => generatePython(project, activeSceneId).files,
    [project, activeSceneId],
  )

  const codeHeight = useEditorStore((state) => state.codeHeight)
  const setCodeHeight = useEditorStore((state) => state.setCodeHeight)
  const codeCollapsed = useEditorStore((state) => state.codeCollapsed)
  const setCodeCollapsed = useEditorStore((state) => state.setCodeCollapsed)
  const codeFile = useEditorStore((state) => state.codeFile)
  const setCodeFile = useEditorStore((state) => state.setCodeFile)
  const error = useRuntimeStore((state) => state.error)

  const [copied, setCopied] = useState(false)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const panelId = useId()

  const activeFile =
    files.find((file) => file.path === codeFile) ??
    files.find((file) => file.path === 'principal.py') ??
    files[0]

  useEffect(() => {
    if (codeFile && !files.some((file) => file.path === codeFile)) setCodeFile(null)
  }, [files, codeFile, setCodeFile])

  useEffect(() => {
    if (!error?.file) return
    if (!files.some((file) => file.path === error.file)) return
    setCodeFile(error.file)
    setCodeCollapsed(false)
  }, [error, files, setCodeFile, setCodeCollapsed])

  const diagnostics = useMemo(() => {
    if (!error?.line || !error.file || error.file !== activeFile?.path) return []
    return [{ line: error.line, message: translateRuntimeError(error) }]
  }, [error, activeFile?.path])

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
        <div
          role="tablist"
          aria-label={messages.code.files}
          className="flex flex-1 flex-wrap items-center gap-1"
        >
          {files.map((file) => {
            const selected = file.path === activeFile?.path
            return (
              <button
                key={file.path}
                type="button"
                role="tab"
                id={`${panelId}-tab-${file.path}`}
                aria-controls={panelId}
                aria-selected={selected}
                onClick={() => setCodeFile(file.path)}
                className={cn(
                  'rounded-md px-2 py-0.5 font-mono text-xs transition',
                  selected
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {file.path}
              </button>
            )
          })}
        </div>

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
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={activeFile ? `${panelId}-tab-${activeFile.path}` : undefined}
          className="min-h-0 flex-1"
        >
          {activeFile ? (
            <LazyCodeEditor
              readOnly
              value={activeFile.content}
              ariaLabel={`${messages.code.title}: ${activeFile.path}`}
              diagnostics={diagnostics}
            />
          ) : (
            <p className="text-muted-foreground p-4 text-sm">{messages.code.empty}</p>
          )}
        </div>
      )}
    </section>
  )
}
