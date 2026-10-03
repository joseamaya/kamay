/// <reference lib="webworker" />
import { PYODIDE_CDN } from './config'
import { EventRegistry } from './eventRegistry'
import type { WorkerRequest, WorkerResponse } from './protocol'
import { toRuntimeError } from './pythonError'
import runtimeSource from './python/runtime.py?raw'
import type { RuntimeCommand, TriggerKind } from './types'

interface PyodideLike {
  FS: {
    mkdirTree: (path: string) => void
    writeFile: (path: string, data: string) => void
  }
  runPythonAsync: (code: string) => Promise<unknown>
}

let pyodidePromise: Promise<PyodideLike> | null = null
let knownFiles: ReadonlySet<string> = new Set()
const registry = new EventRegistry()

function post(message: WorkerResponse): void {
  self.postMessage(message)
}

async function ensurePyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const module = (await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`)) as {
        loadPyodide: (options: { indexURL: string }) => Promise<PyodideLike>
      }
      return module.loadPyodide({ indexURL: PYODIDE_CDN })
    })()
  }
  return pyodidePromise
}

function preload(): void {
  post({ type: 'warmup', status: 'loading' })
  ensurePyodide()
    .then(() => post({ type: 'warmup', status: 'ready' }))
    .catch(() => post({ type: 'warmup', status: 'idle' }))
}

function handleTrigger(kind: TriggerKind, source: string): void {
  try {
    registry.dispatch(kind, source)
  } catch (error) {
    post({ type: 'error', error: toRuntimeError(error, knownFiles) })
  }
}

async function run(files: Record<string, string>, entry: string): Promise<void> {
  knownFiles = new Set(Object.keys(files))
  post({ type: 'status', status: 'loading' })
  try {
    const pyodide = await ensurePyodide()

    ;(globalThis as Record<string, unknown>).__kamay_emit = (payload: string) => {
      try {
        post({ type: 'command', command: JSON.parse(payload) as RuntimeCommand })
      } catch {
        // Ignore malformed commands coming from user code.
      }
    }
    ;(globalThis as Record<string, unknown>).__kamay_registrar = (
      kind: TriggerKind,
      source: string,
      handler: () => void,
    ) => {
      registry.register(kind, source, handler)
    }

    registry.clear()
    pyodide.FS.mkdirTree('/kamay')
    pyodide.FS.writeFile('/kamay/kamay_runtime.py', runtimeSource)
    for (const [name, content] of Object.entries(files)) {
      pyodide.FS.writeFile(`/kamay/${name}`, content)
    }

    await pyodide.runPythonAsync(`import sys
if '/kamay' not in sys.path:
    sys.path.insert(0, '/kamay')
for _name in [name for name, module in list(sys.modules.items()) if getattr(module, '__file__', '').startswith('/kamay')]:
    del sys.modules[_name]
`)
    post({ type: 'status', status: 'running' })

    const source = files[entry] ?? ''
    await pyodide.runPythonAsync(
      `exec(compile(${JSON.stringify(source)}, ${JSON.stringify(entry)}, 'exec'), {'__name__': '__main__'})`,
    )

    post({ type: 'status', status: 'ready' })
  } catch (error) {
    post({ type: 'error', error: toRuntimeError(error, knownFiles) })
    post({ type: 'status', status: 'error' })
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type === 'preload') {
    preload()
  } else if (request.type === 'run') {
    void run(request.files, request.entry)
  } else if (request.type === 'trigger') {
    handleTrigger(request.kind, request.source)
  }
}
