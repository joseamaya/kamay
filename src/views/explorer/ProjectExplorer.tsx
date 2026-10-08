import { getMessages } from '../../i18n'
import { useEditorStore, useGeneratedFiles } from '../../store'
import { cn } from '../../ui/cn'
import { SceneManager } from '../scenes/SceneManager'

export function ProjectExplorer() {
  const messages = getMessages()
  const files = useGeneratedFiles()
  const codeFile = useEditorStore((state) => state.codeFile)
  const setCodeFile = useEditorStore((state) => state.setCodeFile)
  const setCodeCollapsed = useEditorStore((state) => state.setCodeCollapsed)

  const activePath =
    files.find((file) => file.path === codeFile)?.path ??
    files.find((file) => file.path === 'principal.py')?.path ??
    files[0]?.path

  return (
    <div className="flex flex-col gap-4">
      <SceneManager />

      <div className="flex flex-col">
        <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          {messages.explorer.files}
        </h3>
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                aria-current={file.path === activePath ? 'page' : undefined}
                onClick={() => {
                  setCodeFile(file.path)
                  setCodeCollapsed(false)
                }}
                className={cn(
                  'w-full rounded-md border px-2 py-1 text-left font-mono text-xs transition',
                  file.path === activePath
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'border-border hover:bg-muted',
                )}
              >
                {file.path}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
