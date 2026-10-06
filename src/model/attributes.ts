import type { Attribute, Simulation } from './schema'

export type AttributeValue = number | string | boolean

/**
 * Domain attributes the engine interprets by convention. They are the student's
 * own state (declared in the class and emitted in the Python); the engine maps
 * them onto the scene, which lives separately in `object.simulation`.
 *
 * - `distancia` / `altura` / `giro` are offsets from the scene placement;
 * - `tamano` multiplies the scene scale;
 * - `sonido` is the speech bubble.
 */
export const SCENE_ATTRIBUTES: Attribute[] = [
  { name: 'distancia', type: 'number', initial: 0 },
  { name: 'altura', type: 'number', initial: 0 },
  { name: 'giro', type: 'number', initial: 0 },
  { name: 'tamano', type: 'number', initial: 1 },
  { name: 'sonido', type: 'string', initial: '' },
]

export const SCENE_ATTRIBUTE_NAMES = new Set(SCENE_ATTRIBUTES.map((attribute) => attribute.name))

export function isSceneAttribute(name: string): boolean {
  return SCENE_ATTRIBUTE_NAMES.has(name)
}

export interface SceneTransform {
  x: number
  y: number
  rotation: number
  scale: number
  mensaje: string
}

/** Scene transform derived from the simulation state and the interpreted attributes. */
export function sceneTransform(
  simulation: Simulation,
  attributes: Record<string, AttributeValue>,
): SceneTransform {
  return {
    x: simulation.x + readNumber(attributes, 'distancia', 0),
    y: simulation.y + readNumber(attributes, 'altura', 0),
    rotation: simulation.rotation + readNumber(attributes, 'giro', 0),
    scale: simulation.scale * readNumber(attributes, 'tamano', 1),
    mensaje: readString(attributes, 'sonido', '') || simulation.mensaje,
  }
}

export function readNumber(
  attributes: Record<string, AttributeValue>,
  key: string,
  fallback: number,
): number {
  const value = attributes[key]
  return typeof value === 'number' ? value : fallback
}

export function readString(
  attributes: Record<string, AttributeValue>,
  key: string,
  fallback: string,
): string {
  const value = attributes[key]
  return typeof value === 'string' ? value : fallback
}
