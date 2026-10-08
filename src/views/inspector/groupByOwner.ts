export interface OwnerGroup<T> {
  owner: string
  own: boolean
  items: T[]
}

/**
 * Groups resolved members by the class that declares them, preserving the input
 * order (own members first, then each ancestor). Marks the group owned by the
 * object's own class.
 */
export function groupByOwner<T>(
  entries: { value: T; owner: string }[],
  ownOwner: string,
): OwnerGroup<T>[] {
  const groups: OwnerGroup<T>[] = []
  const index = new Map<string, number>()

  for (const entry of entries) {
    let position = index.get(entry.owner)
    if (position === undefined) {
      position = groups.length
      index.set(entry.owner, position)
      groups.push({ owner: entry.owner, own: entry.owner === ownOwner, items: [] })
    }
    groups[position]!.items.push(entry.value)
  }

  return groups
}
