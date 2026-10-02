import { useCallback, useEffect, useState } from 'react'

import { generatePython } from '../generator'
import { useProjectStore, useRuntimeStore } from '../store'
import { createRuntimeBridge } from './bridge'
import { emitRuntimeCommand, emitRuntimeReset } from './bus'

export interface RuntimeApi {
  run: () => void
  stop: () => void
}

export function useRuntime(): RuntimeApi {
  const [bridge] = useState(createRuntimeBridge)

  const setStatus = useRuntimeStore((state) => state.setStatus)
  const setError = useRuntimeStore((state) => state.setError)

  useEffect(() => {
    const offCommand = bridge.onCommand((command) => emitRuntimeCommand(command))
    const offError = bridge.onError((error) => setError(error))
    const offStatus = bridge.onStatus((status) => setStatus(status))
    return () => {
      offCommand()
      offError()
      offStatus()
      bridge.stop()
    }
  }, [bridge, setStatus, setError])

  const run = useCallback(() => {
    const project = useProjectStore.getState().project
    const files = Object.fromEntries(
      generatePython(project).files.map((file) => [file.path, file.content]),
    )
    setError(null)
    emitRuntimeReset()
    void bridge.run(files, 'principal.py')
  }, [bridge, setError])

  const stop = useCallback(() => {
    bridge.stop()
    emitRuntimeReset()
    setStatus('idle')
  }, [bridge, setStatus])

  return { run, stop }
}
