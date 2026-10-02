import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { ACTOR_SIZE, renderScene, toSceneState } from '../../engine'
import type { Actor } from '../../engine'
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
  const [size, setSize] = useState<Point>({ x: 0, y: 0 })

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.x === 0 || size.y === 0 || !scene) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.round(size.x * dpr)
    canvas.height = Math.round(size.y * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const base = toSceneState(scene)
    const drag = dragRef.current
    const actors = drag
      ? base.actors.map((actor) =>
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
      : base.actors

    renderScene(
      ctx,
      { ...base, actors },
      { width: size.x, height: size.y, selectedId: selectedObjectId },
    )
  }, [scene, selectedObjectId, size])

  useEffect(() => {
    draw()
  }, [draw])

  const toScenePoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left - size.x / 2,
      y: size.y / 2 - (event.clientY - rect.top),
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!scene) return
    const point = toScenePoint(event)
    if (!point) return

    const actor = hitTest(toSceneState(scene).actors, point)
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
    draw()
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
    draw()
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
