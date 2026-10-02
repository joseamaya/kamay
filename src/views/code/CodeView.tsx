import { useMemo } from 'react'

import { generatePython } from '../../generator'
import { getMessages } from '../../i18n'
import { useProjectStore } from '../../store'
import { Panel } from '../../ui/Panel'

export function CodeView() {
  const messages = getMessages()
  const project = useProjectStore((state) => state.project)
  const files = useMemo(() => generatePython(project).files, [project])
  const main = files.find((file) => file.path === 'principal.py')

  return (
    <Panel title={messages.code.title} className="min-h-0">
      <div className="flex h-full flex-col gap-2">
        <p className="text-muted-foreground text-xs">{messages.code.subtitle}</p>
        <pre className="bg-muted/50 border-border flex-1 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre">
          {main ? main.content : messages.code.empty}
        </pre>
      </div>
    </Panel>
  )
}
