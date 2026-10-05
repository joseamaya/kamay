import { useCallback, useEffect, useState } from 'react'

import { generatePython } from '../generator'
import { useEditorStore, useObservationsStore, useProjectStore, useRuntimeStore } from '../store'
import { createRuntimeBridge } from './bridge'
import { emitRuntimeCommand, emitRuntimeReset, onRuntimeTrigger } from './bus'
import { scheduleWarmup } from './warmup'

export interface RuntimeApi {
  run: () => void
  stop: () => void
}

export function useRuntime(): RuntimeApi {
  const [bridge] = useState(createRuntimeBridge)

  const setStatus = useRuntimeStore((state) => state.setStatus)
  const setWarmup = useRuntimeStore((state) => state.setWarmup)
  const setError = useRuntimeStore((state) => state.setError)

  useEffect(() => {
    const offCommand = bridge.onCommand((message) => {
      if (message.type === 'state') {
        useObservationsStore.getState().record(message)
        return
      }
      emitRuntimeCommand(message)
    })
    const offError = bridge.onError((error) => setError(error))
    const offStatus = bridge.onStatus((status) => setStatus(status))
    const offTrigger = onRuntimeTrigger((trigger) => bridge.trigger(trigger.kind, trigger.source))
    return () => {
      offCommand()
      offError()
      offStatus()
      offTrigger()
      bridge.stop()
    }
  }, [bridge, setStatus, setError])

  useEffect(() => {
    const offWarmup = bridge.onWarmup(setWarmup)
    const cancel = scheduleWarmup({
      disabled: import.meta.env.VITE_KAMAY_DISABLE_PRELOAD === '1',
      preload: () => {
        void bridge.preload().catch(() => undefined)
      },
    })
    return () => {
      offWarmup()
      cancel()
    }
  }, [bridge, setWarmup])

  const run = useCallback(() => {
    const project = useProjectStore.getState().project
    const activeSceneId = useEditorStore.getState().activeSceneId
    const files = Object.fromEntries(
      generatePython(project, activeSceneId).files.map((file) => [file.path, file.content]),
    )
    setError(null)
    setStatus('loading')
    useObservationsStore.getState().reset()
    emitRuntimeReset()
    void bridge.run(files, 'principal.py')
  }, [bridge, setError, setStatus])

  const stop = useCallback(() => {
    bridge.stop()
    emitRuntimeReset()
    useObservationsStore.getState().reset()
    setStatus('idle')
  }, [bridge, setStatus])

  return { run, stop }
}
