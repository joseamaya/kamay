import type { GeneratedSymbol } from '../../generator'
import type { MemberRef } from '../../store'

/** The generated symbol that locates a model member, or `undefined` when absent. */
export function findSymbol(
  symbols: GeneratedSymbol[],
  member: MemberRef,
): GeneratedSymbol | undefined {
  switch (member.kind) {
    case 'object':
      return symbols.find(
        (symbol) => symbol.kind === 'object' && symbol.objectName === member.objectName,
      )
    case 'method':
      return symbols.find(
        (symbol) =>
          symbol.kind === 'method' &&
          symbol.className === member.className &&
          symbol.member === member.name,
      )
    case 'attribute':
      return symbols.find(
        (symbol) =>
          symbol.kind === 'attribute' &&
          symbol.className === member.className &&
          symbol.member === member.name,
      )
    case 'component':
      return symbols.find(
        (symbol) =>
          symbol.kind === 'component' &&
          symbol.className === member.className &&
          symbol.member === member.name,
      )
    case 'order':
      return symbols.find(
        (symbol) => symbol.kind === 'order' && symbol.orderIndex === member.orderIndex,
      )
  }
}

/** The model member a generated symbol points to, or `null` for structural symbols. */
export function symbolMemberRef(symbol: GeneratedSymbol): MemberRef | null {
  switch (symbol.kind) {
    case 'object':
      return symbol.objectName ? { kind: 'object', objectName: symbol.objectName } : null
    case 'method':
      return symbol.className && symbol.member
        ? { kind: 'method', className: symbol.className, name: symbol.member }
        : null
    case 'attribute':
      return symbol.className && symbol.member
        ? { kind: 'attribute', className: symbol.className, name: symbol.member }
        : null
    case 'component':
      return symbol.className && symbol.member
        ? { kind: 'component', className: symbol.className, name: symbol.member }
        : null
    case 'order':
      return symbol.orderIndex != null ? { kind: 'order', orderIndex: symbol.orderIndex } : null
    case 'class':
    case 'init':
      return null
  }
}
