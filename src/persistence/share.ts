import { parseProject } from '../model'
import type { Project } from '../model'
import { ProjectImportError } from './file'

export const SHARE_HASH_KEY = 'p'

const GZIP_PREFIX = 'g.'
const PLAIN_PREFIX = 'j.'
const MAX_SHARE_LENGTH = 1_000_000

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function gzip(input: Uint8Array): Promise<Uint8Array> {
  const source = new Blob([input.buffer as ArrayBuffer])
  const stream = source.stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(input: Uint8Array): Promise<Uint8Array> {
  const source = new Blob([input.buffer as ArrayBuffer])
  const stream = source.stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function encodeSharePayload(project: Project): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(project))
  if (typeof CompressionStream !== 'undefined') {
    try {
      return `${GZIP_PREFIX}${toBase64Url(await gzip(bytes))}`
    } catch {
      // Fall back to the uncompressed form when gzip is unavailable.
    }
  }
  return `${PLAIN_PREFIX}${toBase64Url(bytes)}`
}

export async function decodeSharePayload(payload: string): Promise<Project> {
  if (!payload || payload.length > MAX_SHARE_LENGTH) {
    throw new ProjectImportError(['invalid_share'])
  }

  let bytes: Uint8Array
  try {
    if (payload.startsWith(GZIP_PREFIX)) {
      bytes = await gunzip(fromBase64Url(payload.slice(GZIP_PREFIX.length)))
    } else if (payload.startsWith(PLAIN_PREFIX)) {
      bytes = fromBase64Url(payload.slice(PLAIN_PREFIX.length))
    } else {
      throw new Error('unknown_codec')
    }
  } catch {
    throw new ProjectImportError(['invalid_share'])
  }

  let raw: unknown
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new ProjectImportError(['invalid_json'])
  }

  const result = parseProject(raw)
  if (!result.success) {
    throw new ProjectImportError(result.error.issues.map((issue) => issue.message))
  }
  return result.data
}

export function readSharePayload(hash: string): string | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(clean).get(SHARE_HASH_KEY)
}

export async function encodeShareUrl(project: Project, base: string): Promise<string> {
  return `${base}#${SHARE_HASH_KEY}=${await encodeSharePayload(project)}`
}
