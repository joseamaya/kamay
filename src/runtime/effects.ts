import { readString, sceneTransform } from '../model'
import type { AttributeValue, Simulation } from '../model'
import type { RuntimeCommand } from './types'

/**
 * The scene effect a domain attribute change produces. The engine interprets a
 * few well-known domain attributes by convention and maps them onto the scene,
 * which lives separately in the object's simulation state.
 */
export function stateEffect(
  target: string,
  name: string,
  attributes: Record<string, AttributeValue>,
  simulation: Simulation,
): RuntimeCommand | null {
  if (name === 'sonido') {
    const message = readString(attributes, 'sonido', '')
    return message.length > 0 ? { type: 'say', target, message } : null
  }
  if (name !== 'distancia' && name !== 'altura' && name !== 'giro' && name !== 'tamano') return null

  const scene = sceneTransform(simulation, attributes)
  if (name === 'distancia' || name === 'altura') {
    return { type: 'move', target, x: scene.x, y: scene.y }
  }
  if (name === 'giro') return { type: 'rotate', target, degrees: scene.rotation }
  return { type: 'scale', target, factor: scene.scale }
}
