import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

import {
  ACTOR_SIZE,
  RuntimeController,
  createLoop,
  renderBubbles,
  renderScene,
  toSceneState,
} from '../../engine'
import type { Actor } from '../../engine'
import { getMessages } from '../../i18n'
import { collisionKey, readNumber } from '../../model'
import { emitRuntimeTrigger, onRuntimeCommand, onRuntimeReset } from '../../runtime'
import {
  useActiveScene,
  useEditorStore,
  usePreferencesStore,
  useProjectStore,
  useRuntimeStore,
} from '../../store'

interface Point {
  x: number
  y: number
}

interface DragState {
  objectId: string
  name: string
  pointerStart: Point
  origin: Point
  offset: Point
}

const MOVE_STEP = 4
const MOVE_STEP_FAST = 16

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function distanceCollisions(actors: Actor[]): Set<string> {
  const colliding = new Set<string>()
  for (let i = 0; i < actors.length; i += 1) {
    for (let j = i + 1; j < actors.length; j += 1) {
      const first = actors[i]!
      const second = actors[j]!
      const radius =
        (ACTOR_SIZE / 2) * Math.max(first.transform.scale, 0.2) +
        (ACTOR_SIZE / 2) * Math.max(second.transform.scale, 0.2)
      const dx = first.transform.position.x - second.transform.position.x
      const dy = first.transform.position.y - second.transform.position.y
      if (dx * dx + dy * dy <= radius * radius) {
        colliding.add(collisionKey(first.name, second.name))
      }
    }
  }
  return colliding
}

function hitTest(actors: Actor[], point: Point): Actor | null {
  for (let index = actors.length - 1; index >= 0; index -= 1) {
    const actor = actors[index]!
    const radius = (ACTOR_SIZE / 2) * Math.max(actor.transform.scale, 0.2)
    if (distanceSquared(actor.transform.position, point) <= radius * radius) return actor
  }
  return null
}

export function ScenarioCanvas() {
  const messages = getMessages()
  const scene = useActiveScene()
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)
  const runtimeStatus = useRuntimeStore((state) => state.status)
  const reducedMotion = usePreferencesStore((state) => state.reducedMotion)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const controllerRef = useRef(new RuntimeController())
  const [size, setSize] = useState<Point>({ x: 0, y: 0 })

  const sceneRef = useRef(scene)
  const selectedRef = useRef(selectedObjectId)
  const sizeRef = useRef(size)
  const lastSizeRef = useRef<Point>({ x: 0, y: 0 })
  const runtimeStatusRef = useRef(runtimeStatus)
  const collisionsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    selectedRef.current = selectedObjectId
  }, [selectedObjectId])

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  useEffect(() => {
    runtimeStatusRef.current = runtimeStatus
  }, [runtimeStatus])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const update = () => setSize({ x: element.clientWidth, y: element.clientHeight })
    update()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!scene) return
    controllerRef.current.reset(toSceneState(scene))
    collisionsRef.current.clear()
  }, [scene])

  useEffect(() => {
    controllerRef.current.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    if (runtimeStatus !== 'ready' && runtimeStatus !== 'running') return
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      const source = event.key.length === 1 ? event.key.toLowerCase() : event.key
      emitRuntimeTrigger({ kind: 'key', source })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [runtimeStatus])

  useEffect(() => onRuntimeCommand((command) => controllerRef.current.apply(command)), [])

  useEffect(
    () =>
      onRuntimeReset(() => {
        const current = sceneRef.current
        if (current) controllerRef.current.reset(toSceneState(current))
        collisionsRef.current.clear()
      }),
    [],
  )

  const detectCollisions = useCallback(() => {
    // Only detect once the program finished registering its handlers.
    if (runtimeStatusRef.current !== 'ready') {
      collisionsRef.current.clear()
      return
    }

    const physicsCollisions = controllerRef.current.getCollisions()
    const colliding = physicsCollisions ?? distanceCollisions(controllerRef.current.getActors())

    for (const key of colliding) {
      if (!collisionsRef.current.has(key)) {
        emitRuntimeTrigger({ kind: 'collision', source: key })
      }
    }
    collisionsRef.current = new Set(colliding)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const { x: width, y: height } = sizeRef.current
    if (!canvas || width === 0 || height === 0) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    if (lastSizeRef.current.x !== width || lastSizeRef.current.y !== height) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      lastSizeRef.current = { x: width, y: height }
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const background = sceneRef.current?.background ?? 'grass'
    let actors = controllerRef.current.getActors()
    const drag = dragRef.current
    if (drag) {
      actors = actors.map((actor) =>
        actor.id === drag.objectId
          ? {
              ...actor,
              transform: {
                ...actor.transform,
                position: {
                  x: drag.origin.x + drag.offset.x,
                  y: drag.origin.y + drag.offset.y,
                },
              },
            }
          : actor,
      )
    }

    const options = { width, height, selectedId: selectedRef.current }
    renderScene(ctx, { background, actors }, options)
    renderBubbles(ctx, controllerRef.current.getBubbles(), actors, options)
  }, [])

  useEffect(() => {
    const loop = createLoop({
      update: (delta) => {
        controllerRef.current.update(delta)
        detectCollisions()
      },
      render,
    })
    loop.start()
    return () => loop.stop()
  }, [render, detectCollisions])

  const toScenePoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left - sizeRef.current.x / 2,
      y: sizeRef.current.y / 2 - (event.clientY - rect.top),
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!scene) return
    const point = toScenePoint(event)
    if (!point) return

    const actor = hitTest(controllerRef.current.getActors(), point)
    if (!actor) {
      selectObject(null)
      return
    }

    selectObject(actor.id)
    dragRef.current = {
      objectId: actor.id,
      name: actor.name,
      pointerStart: point,
      origin: { ...actor.transform.position },
      offset: { x: 0, y: 0 },
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = toScenePoint(event)
    if (!point) return
    dragRef.current = {
      ...drag,
      offset: { x: point.x - drag.pointerStart.x, y: point.y - drag.pointerStart.y },
    }
  }

  const handlePointerUp = () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return

    const moved = drag.offset.x !== 0 || drag.offset.y !== 0
    if (scene && moved) {
      updateObjectAttributes(scene.id, drag.objectId, {
        x: Math.round(drag.origin.x + drag.offset.x),
        y: Math.round(drag.origin.y + drag.offset.y),
      })
    }

    if (!moved && (runtimeStatus === 'ready' || runtimeStatus === 'running')) {
      emitRuntimeTrigger({ kind: 'click', source: drag.name })
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (!scene) return

    const running = runtimeStatus === 'ready' || runtimeStatus === 'running'

    // Enter/Space emulate a click on the selected object, even while running.
    if (running && (event.key === 'Enter' || event.key === ' ')) {
      const selected = scene.objects.find((candidate) => candidate.id === selectedObjectId)
      if (selected) {
        event.preventDefault()
        emitRuntimeTrigger({ kind: 'click', source: selected.name })
        return
      }
    }

    // While the program runs, the other keys go to its event handlers.
    if (running) return

    if (event.key === 'Escape') {
      selectObject(null)
      return
    }

    const object = scene.objects.find((candidate) => candidate.id === selectedObjectId)
    if (!object) return

    const step = event.shiftKey ? MOVE_STEP_FAST : MOVE_STEP
    let dx = 0
    let dy = 0
    if (event.key === 'ArrowLeft') dx = -step
    else if (event.key === 'ArrowRight') dx = step
    else if (event.key === 'ArrowUp') dy = step
    else if (event.key === 'ArrowDown') dy = -step

    if (dx !== 0 || dy !== 0) {
      event.preventDefault()
      updateObjectAttributes(scene.id, object.id, {
        x: readNumber(object.attributes, 'x', 0) + dx,
        y: readNumber(object.attributes, 'y', 0) + dy,
      })
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={messages.scenario.canvasLabel}
        className="focus-visible:ring-ring h-full w-full cursor-grab touch-none rounded-md focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
        style={{ width: `${size.x}px`, height: `${size.y}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
