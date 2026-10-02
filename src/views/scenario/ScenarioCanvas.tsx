import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import {
  ACTOR_SIZE,
  RuntimeController,
  createLoop,
  renderBubbles,
  renderScene,
  toSceneState,
} from '../../engine'
import type { Actor } from '../../engine'
import { onRuntimeCommand, onRuntimeReset } from '../../runtime'
import { useActiveScene, useEditorStore, useProjectStore } from '../../store'

interface Point {
  x: number
  y: number
}

interface DragState {
  objectId: string
  pointerStart: Point
  origin: Point
  offset: Point
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
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
  const scene = useActiveScene()
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId)
  const selectObject = useEditorStore((state) => state.selectObject)
  const updateObjectAttributes = useProjectStore((state) => state.updateObjectAttributes)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const controllerRef = useRef(new RuntimeController())
  const [size, setSize] = useState<Point>({ x: 0, y: 0 })

  const sceneRef = useRef(scene)
  const selectedRef = useRef(selectedObjectId)
  const sizeRef = useRef(size)
  const lastSizeRef = useRef<Point>({ x: 0, y: 0 })

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
    if (scene) controllerRef.current.reset(toSceneState(scene))
  }, [scene])

  useEffect(() => onRuntimeCommand((command) => controllerRef.current.apply(command)), [])

  useEffect(
    () =>
      onRuntimeReset(() => {
        const current = sceneRef.current
        if (current) controllerRef.current.reset(toSceneState(current))
      }),
    [],
  )

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
      update: (delta) => controllerRef.current.update(delta),
      render,
    })
    loop.start()
    return () => loop.stop()
  }, [render])

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

    if (scene && (drag.offset.x !== 0 || drag.offset.y !== 0)) {
      updateObjectAttributes(scene.id, drag.objectId, {
        x: Math.round(drag.origin.x + drag.offset.x),
        y: Math.round(drag.origin.y + drag.offset.y),
      })
    }
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab touch-none rounded-md active:cursor-grabbing"
        style={{ width: `${size.x}px`, height: `${size.y}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}
