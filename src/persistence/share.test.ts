import { describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import { ProjectImportError } from './file'
import { decodeSharePayload, encodeSharePayload, encodeShareUrl, readSharePayload } from './share'

describe('encodeSharePayload / decodeSharePayload', () => {
  it('round-trips a project through a compressed payload', async () => {
    const project = createEmptyProject({ name: 'Compartido' })
    const payload = await encodeSharePayload(project)
    expect(await decodeSharePayload(payload)).toEqual(project)
  })

  it('falls back to an uncompressed payload when gzip is unavailable', async () => {
    const globals = globalThis as unknown as Record<string, unknown>
    const original = globals.CompressionStream
    globals.CompressionStream = undefined
    try {
      const project = createEmptyProject({ name: 'Plano' })
      const payload = await encodeSharePayload(project)
      expect(payload.startsWith('j.')).toBe(true)
      expect(await decodeSharePayload(payload)).toEqual(project)
    } finally {
      globals.CompressionStream = original
    }
  })

  it('rejects empty, unknown and oversized payloads', async () => {
    await expect(decodeSharePayload('')).rejects.toThrow(ProjectImportError)
    await expect(decodeSharePayload('x.abc')).rejects.toThrow(ProjectImportError)
    await expect(decodeSharePayload(`g.${'a'.repeat(1_000_001)}`)).rejects.toThrow(
      ProjectImportError,
    )
  })

  it('rejects a payload that is not a valid project', async () => {
    await expect(decodeSharePayload('j.bm90IGpzb24')).rejects.toThrow(ProjectImportError)
  })
})

describe('readSharePayload', () => {
  it('reads the payload from a hash with or without the leading #', () => {
    expect(readSharePayload('#p=abc')).toBe('abc')
    expect(readSharePayload('p=abc')).toBe('abc')
  })

  it('returns null when the hash has no payload', () => {
    expect(readSharePayload('#x=1')).toBeNull()
    expect(readSharePayload('')).toBeNull()
  })
})

describe('encodeShareUrl', () => {
  it('appends the payload to the base url', async () => {
    const url = await encodeShareUrl(createEmptyProject(), 'https://kamay.app/')
    expect(url.startsWith('https://kamay.app/#p=')).toBe(true)
  })
})
