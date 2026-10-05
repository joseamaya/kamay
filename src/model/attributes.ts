import type { Attribute } from './schema'

export type AttributeValue = number | string | boolean

/**
 * Attributes the engine reacts to without a drawing primitive: position and
 * transform drive the canvas and `mensaje` shows a speech bubble. They are
 * always available to methods and are not part of a class's own attributes.
 */
export const ENGINE_ATTRIBUTES: Attribute[] = [
  { name: 'x', type: 'number', initial: 0 },
  { name: 'y', type: 'number', initial: 0 },
  { name: 'rotation', type: 'number', initial: 0 },
  { name: 'scale', type: 'number', initial: 1 },
  { name: 'mensaje', type: 'string', initial: '' },
]

export const ENGINE_ATTRIBUTE_NAMES = new Set(ENGINE_ATTRIBUTES.map((attribute) => attribute.name))

export function isEngineAttribute(name: string): boolean {
  return ENGINE_ATTRIBUTE_NAMES.has(name)
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
