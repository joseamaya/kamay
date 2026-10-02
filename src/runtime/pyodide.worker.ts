/// <reference lib="webworker" />
import { PYODIDE_CDN } from './config'
import type { WorkerRequest, WorkerResponse } from './protocol'
import runtimeSource from './python/runtime.py?raw'
import type { RuntimeCommand, RuntimeError } from './types'

interface PyodideLike {
  FS: {
    mkdirTree: (path: string) => void
    writeFile: (path: string, data: string) => void
  }
  runPythonAsync: (code: string) => Promise<unknown>
}

let pyodidePromise: Promise<PyodideLike> | null = null

function post(message: WorkerResponse): void {
  self.postMessage(message)
}

async function ensurePyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    post({ type: 'status', status: 'loading' })
    pyodidePromise = (async () => {
      const module = (await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`)) as {
        loadPyodide: (options: { indexURL: string }) => Promise<PyodideLike>
      }
      return module.loadPyodide({ indexURL: PYODIDE_CDN })
    })()
  }
  return pyodidePromise
}

function toRuntimeError(error: unknown): RuntimeError {
  const message = error instanceof Error ? error.message : String(error)
  const lineMatch = message.match(/line (\d+)/)
  const kindMatch = message.match(/([A-Za-z_]*Error)/)
  return {
    kind: kindMatch ? kindMatch[1] : 'Error',
    message,
    line: lineMatch ? Number(lineMatch[1]) : null,
  }
}

async function run(files: Record<string, string>, entry: string): Promise<void> {
  try {
    const pyodide = await ensurePyodide()

    ;(globalThis as Record<string, unknown>).__kamay_emit = (payload: string) => {
      try {
        post({ type: 'command', command: JSON.parse(payload) as RuntimeCommand })
      } catch {
        // Ignore malformed commands coming from user code.
      }
    }

    pyodide.FS.mkdirTree('/kamay')
    pyodide.FS.writeFile('/kamay/kamay_runtime.py', runtimeSource)
    for (const [name, content] of Object.entries(files)) {
      pyodide.FS.writeFile(`/kamay/${name}`, content)
    }

    await pyodide.runPythonAsync("import sys; sys.path.insert(0, '/kamay')")
    post({ type: 'status', status: 'running' })

    const source = files[entry] ?? ''
    await pyodide.runPythonAsync(
      `exec(compile(${JSON.stringify(source)}, ${JSON.stringify(entry)}, 'exec'), {'__name__': '__main__'})`,
    )

    post({ type: 'status', status: 'ready' })
  } catch (error) {
    post({ type: 'error', error: toRuntimeError(error) })
    post({ type: 'status', status: 'error' })
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type === 'preload') {
    void ensurePyodide()
  } else if (request.type === 'run') {
    void run(request.files, request.entry)
  }
}
