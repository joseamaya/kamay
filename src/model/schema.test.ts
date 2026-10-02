import { describe, expect, it } from 'vitest'

import { CURRENT_SCHEMA_VERSION, parseProject, projectSchema } from './index'

const minimalProject = {
  version: CURRENT_SCHEMA_VERSION,
  meta: { name: 'Demo' },
  scenes: [{ id: 'scene-1', name: 'Principal' }],
}

describe('projectSchema', () => {
  it('parses a minimal project and applies defaults', () => {
    const result = projectSchema.safeParse(minimalProject)

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.meta.author).toBe('')
    expect(result.data.scenes[0]?.classes).toEqual([])
    expect(result.data.scenes[0]?.objects).toEqual([])
    expect(result.data.scenes[0]?.events).toEqual([])
    expect(result.data.scenes[0]?.background).toBe('grass')
  })

  it('rejects a class name that is not a valid identifier', () => {
    const result = projectSchema.safeParse({
      ...minimalProject,
      scenes: [{ id: 's', name: 'Principal', classes: [{ id: 'c', name: '2Heroe' }] }],
    })

    expect(result.success).toBe(false)
  })

  it('rejects a project without scenes', () => {
    const result = projectSchema.safeParse({ ...minimalProject, scenes: [] })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown attribute type', () => {
    const result = projectSchema.safeParse({
      ...minimalProject,
      scenes: [
        {
          id: 's',
          name: 'Principal',
          classes: [
            { id: 'c', name: 'Heroe', attributes: [{ name: 'vida', type: 'color', initial: 1 }] },
          ],
        },
      ],
    })

    expect(result.success).toBe(false)
  })
})

describe('parseProject', () => {
  it('returns a failure result for invalid input instead of throwing', () => {
    const result = parseProject({ version: 1, meta: {}, scenes: 'nope' })
    expect(result.success).toBe(false)
  })

  it('accepts valid input', () => {
    const result = parseProject(minimalProject)
    expect(result.success).toBe(true)
  })
})
