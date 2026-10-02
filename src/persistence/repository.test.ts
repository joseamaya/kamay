import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyProject } from '../model'
import { openKamayDb } from './db'
import { createRepository } from './repository'
import type { ProjectRecord, ProjectRepository } from './types'

function record(id: string, name: string): ProjectRecord {
  return {
    id,
    name,
    updatedAt: new Date().toISOString(),
    project: createEmptyProject({ name }),
  }
}

describe('createRepository', () => {
  let repository: ProjectRepository

  beforeEach(async () => {
    const db = await openKamayDb()
    await db.clear('projects')
    repository = createRepository(db)
  })

  it('saves and reads a project by id', async () => {
    await repository.save(record('p1', 'Demo'))
    const found = await repository.get('p1')
    expect(found?.name).toBe('Demo')
  })

  it('lists projects sorted by most recently updated', async () => {
    await repository.save({ ...record('p1', 'Uno'), updatedAt: '2026-01-01T00:00:00.000Z' })
    await repository.save({ ...record('p2', 'Dos'), updatedAt: '2026-02-01T00:00:00.000Z' })

    const projects = await repository.list()
    expect(projects.map((item) => item.id)).toEqual(['p2', 'p1'])
  })

  it('removes a project', async () => {
    await repository.save(record('p1', 'Demo'))
    await repository.remove('p1')
    expect(await repository.get('p1')).toBeNull()
  })
})
