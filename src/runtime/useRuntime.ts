import { useCallback, useEffect, useRef, useState } from 'react'

import { generatePython } from '../generator'
import { objectAppearance, resolveObjectAttributes } from '../model'
import { useEditorStore, useObservationsStore, useProjectStore, useRuntimeStore } from '../store'
import { createRuntimeBridge } from './bridge'
import { emitRuntimeCommand, emitRuntimeReset, onRuntimeTrigger } from './bus'
import { stateEffect } from './effects'
import { hasRawCode, Simulation } from './simulation'
import { currentStep, remainingSteps } from './steps'
import type { RuntimeMessage } from './types'
import { scheduleWarmup } from './warmup'

export interface RuntimeApi {
  run: () => void
  stop: () => void
  setStepMode: (on: boolean) => void
  step: () => void
  back: () => void
  resume: () => void
}

type RunMode = 'python' | 'simulation'

function resolveRuntimeObject(target: string) {
  const project = useProjectStore.getState().project
  const scene = project.scenes.find((candidate) =>
    candidate.objects.some((object) => object.name === target),
  )
  const object = scene?.objects.find((candidate) => candidate.name === target)
  if (!scene || !object) return null
  const runtimeValues = useObservationsStore.getState().values[target] ?? {}
  return { scene, object, runtimeValues }
}

/** A state change updates the object's look and any state-driven engine effect. */
function emitStateEffects(target: string, name: string): void {
  const resolved = resolveRuntimeObject(target)
  if (!resolved) return
  const { scene, object, runtimeValues } = resolved
  const appearance = objectAppearance(scene, object, runtimeValues)
  emitRuntimeCommand({ type: 'appearance', target, ...appearance })
  const effect = stateEffect(target, name, resolveObjectAttributes(scene, object, runtimeValues))
  if (effect) emitRuntimeCommand(effect)
}

function applyRuntimeMessage(message: RuntimeMessage): void {
  if (message.type === 'state') {
    useObservationsStore.getState().record(message)
    emitStateEffects(message.target, message.name)
    return
  }
  emitRuntimeCommand(message)
}

function handleRuntimeMessage(message: RuntimeMessage): void {
  const runtime = useRuntimeStore.getState()
  if (runtime.stepMode) {
    runtime.enqueueStep(message)
    return
  }
  applyRuntimeMessage(message)
}

export function useRuntime(): RuntimeApi {
  const [bridge] = useState(createRuntimeBridge)
  const simulationRef = useRef<Simulation | null>(null)
  const modeRef = useRef<RunMode | null>(null)

  const setStatus = useRuntimeStore((state) => state.setStatus)
  const setWarmup = useRuntimeStore((state) => state.setWarmup)
  const setError = useRuntimeStore((state) => state.setError)

  useEffect(() => {
    const offCommand = bridge.onCommand(handleRuntimeMessage)
    const offError = bridge.onError((error) => setError(error))
    const offStatus = bridge.onStatus((status) => setStatus(status))
    const offTrigger = onRuntimeTrigger((trigger) => {
      const simulation = simulationRef.current
      if (simulation) simulation.trigger(trigger.kind, trigger.source)
      else bridge.trigger(trigger.kind, trigger.source)
    })
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
    setError(null)
    setStatus('loading')
    useObservationsStore.getState().reset()
    useRuntimeStore.getState().resetSteps()
    emitRuntimeReset()

    if (hasRawCode(project, activeSceneId)) {
      simulationRef.current?.stop()
      simulationRef.current = null
      modeRef.current = 'python'
      const files = Object.fromEntries(
        generatePython(project, activeSceneId).files.map((file) => [file.path, file.content]),
      )
      void bridge.run(files, 'principal.py')
      return
    }

    if (modeRef.current === 'python') bridge.stop()
    modeRef.current = 'simulation'
    const simulation = new Simulation({
      project,
      sceneId: activeSceneId,
      emit: handleRuntimeMessage,
      onError: setError,
      onStatus: setStatus,
    })
    simulationRef.current = simulation
    simulation.start()
  }, [bridge, setError, setStatus])

  const stop = useCallback(() => {
    simulationRef.current?.stop()
    simulationRef.current = null
    modeRef.current = null
    bridge.stop()
    emitRuntimeReset()
    useObservationsStore.getState().reset()
    useRuntimeStore.getState().resetSteps()
    setStatus('idle')
  }, [bridge, setStatus])

  const setStepMode = useCallback((on: boolean) => {
    useRuntimeStore.getState().setStepMode(on)
  }, [])

  const step = useCallback(() => {
    const queue = useRuntimeStore.getState().stepQueue
    const next = currentStep(queue)
    if (!next) return
    for (const message of next) applyRuntimeMessage(message)
    useRuntimeStore.getState().advanceStep()
  }, [])

  const back = useCallback(() => {
    const queue = useRuntimeStore.getState().stepQueue
    const target = Math.max(0, queue.cursor - 1)
    if (target === queue.cursor) return
    emitRuntimeReset()
    useObservationsStore.getState().reset()
    for (let index = 0; index < target; index += 1) {
      const step = queue.steps[index]
      if (!step) continue
      for (const message of step) applyRuntimeMessage(message)
    }
    useRuntimeStore.getState().setCursor(target)
  }, [])

  const resume = useCallback(() => {
    const queue = useRuntimeStore.getState().stepQueue
    for (const group of remainingSteps(queue)) {
      for (const message of group) applyRuntimeMessage(message)
    }
    useRuntimeStore.getState().resetSteps()
    useRuntimeStore.getState().setStepMode(false)
  }, [])

  return { run, stop, setStepMode, step, back, resume }
}
