import { describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import {
  ProjectImportError,
  exportProject,
  importProject,
  projectFileName,
  PROJECT_FILE_EXTENSION,
} from './file'

describe('exportProject / importProject', () => {
  it('round-trips a project through a blob', async () => {
    const project = createEmptyProject({ name: 'Mi juego' })
    const text = await exportProject(project).text()
    const restored = importProject(text)
    expect(restored).toEqual(project)
  })

  it('rejects invalid JSON', () => {
    expect(() => importProject('{not json')).toThrow(ProjectImportError)
  })

  it('rejects a project that does not match the schema', () => {
    expect(() => importProject(JSON.stringify({ version: 1, scenes: [] }))).toThrow(
      ProjectImportError,
    )
  })
})

describe('projectFileName', () => {
  it('slugifies the project name and appends the extension', () => {
    const project = createEmptyProject({ name: '  ¡Hola, Mundo!  ' })
    expect(projectFileName(project)).toBe(`hola-mundo${PROJECT_FILE_EXTENSION}`)
  })

  it('strips diacritics from the project name', () => {
    const project = createEmptyProject({ name: 'Canción del Sur' })
    expect(projectFileName(project)).toBe(`cancion-del-sur${PROJECT_FILE_EXTENSION}`)
  })
})
