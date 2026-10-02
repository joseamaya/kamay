export type AttributeValue = number | string | boolean

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
