import { readNumber, readString } from '../model'
import type { AttributeValue } from '../model'
import type { RuntimeCommand } from './types'

/**
 * The engine effect a state change produces, without any drawing primitive:
 * position and transform move the actor and `mensaje` shows a speech bubble.
 */
export function stateEffect(
  target: string,
  name: string,
  attributes: Record<string, AttributeValue>,
): RuntimeCommand | null {
  switch (name) {
    case 'x':
    case 'y':
      return {
        type: 'move',
        target,
        x: readNumber(attributes, 'x', 0),
        y: readNumber(attributes, 'y', 0),
      }
    case 'rotation':
      return { type: 'rotate', target, degrees: readNumber(attributes, 'rotation', 0) }
    case 'scale':
      return { type: 'scale', target, factor: readNumber(attributes, 'scale', 1) }
    case 'mensaje': {
      const message = readString(attributes, 'mensaje', '')
      return message.length > 0 ? { type: 'say', target, message } : null
    }
    default:
      return null
  }
}
