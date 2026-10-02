import { parseProject } from '../model'
import type { Project } from '../model'

export const PROJECT_FILE_EXTENSION = '.kamay.json'

export class ProjectImportError extends Error {
  readonly issues: string[]

  constructor(issues: string[] = []) {
    super('invalid_project')
    this.name = 'ProjectImportError'
    this.issues = issues
  }
}

export function exportProject(project: Project): Blob {
  return new Blob([`${JSON.stringify(project, null, 2)}\n`], { type: 'application/json' })
}

export function projectFileName(project: Project): string {
  const base =
    project.meta.name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'proyecto'
  return `${base}${PROJECT_FILE_EXTENSION}`
}

export function importProject(source: string): Project {
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch {
    throw new ProjectImportError(['invalid_json'])
  }

  const result = parseProject(raw)
  if (!result.success) {
    throw new ProjectImportError(result.error.issues.map((issue) => issue.message))
  }
  return result.data
}

export async function readProjectFile(file: File): Promise<Project> {
  return importProject(await file.text())
}
