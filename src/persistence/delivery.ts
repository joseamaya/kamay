import { generatePython } from '../generator'
import type { Project } from '../model'
import { evaluateRubric } from '../missions'
import type { MissionId, RubricEntry } from '../missions'
import { emptyEvidence } from '../pedagogy'
import type { Evidence } from '../pedagogy'
import { projectSlug } from './file'

export interface Delivery {
  app: 'kamay'
  kind: 'entrega'
  exportedAt: string
  project: Project
  python: Record<string, string>
  missions: { completed: MissionId[]; total: number }
  rubric: RubricEntry[]
  evidence: Evidence
}

export function buildDelivery(
  project: Project,
  completed: readonly MissionId[],
  total: number,
  now: Date = new Date(),
  evidence: Evidence = emptyEvidence(),
): Delivery {
  const files = generatePython(project).files
  return {
    app: 'kamay',
    kind: 'entrega',
    exportedAt: now.toISOString(),
    project,
    python: Object.fromEntries(files.map((file) => [file.path, file.content])),
    missions: { completed: [...completed], total },
    rubric: evaluateRubric(project),
    evidence,
  }
}

export function exportDelivery(delivery: Delivery): Blob {
  return new Blob([`${JSON.stringify(delivery, null, 2)}\n`], { type: 'application/json' })
}

export function deliveryFileName(project: Project, now: Date = new Date()): string {
  return `${projectSlug(project)}-entrega-${now.toISOString().slice(0, 10)}.json`
}
