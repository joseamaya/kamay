import { z } from 'zod'

import { generatePython } from '../generator'
import { parseProject } from '../model'
import type { Project } from '../model'
import { evaluateRubric } from '../missions'
import type { MissionId, RubricEntry } from '../missions'
import { emptyEvidence, EVIDENCE_VERSION } from '../pedagogy'
import type { Evidence, MisconceptionId } from '../pedagogy'
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

const rubricEntrySchema = z.object({
  id: z.enum([
    'objects',
    'orders',
    'classes',
    'state',
    'inheritance',
    'polymorphism',
    'composition',
    'events',
  ]),
  status: z.enum(['introduced', 'practiced', 'demonstrated']),
  count: z.number(),
})

const predictionTallySchema = z.object({
  correct: z.number(),
  misconception: z.number(),
  explained: z.number(),
})

const evidenceSchema = z.object({
  version: z.literal(EVIDENCE_VERSION),
  misconceptions: z.array(z.string()),
  predictions: z.record(z.string(), predictionTallySchema),
  missionDates: z.record(z.string(), z.string()).optional(),
})

const deliverySchema = z.object({
  app: z.literal('kamay'),
  kind: z.literal('entrega'),
  exportedAt: z.string(),
  project: z.unknown(),
  python: z.record(z.string(), z.string()),
  missions: z.object({ completed: z.array(z.string()), total: z.number() }),
  rubric: z.array(rubricEntrySchema),
  evidence: evidenceSchema.optional(),
})

/** Validates and normalizes an imported delivery file. Returns null when invalid. */
export function parseDelivery(input: unknown): Delivery | null {
  const result = deliverySchema.safeParse(input)
  if (!result.success) return null

  const project = parseProject(result.data.project)
  if (!project.success) return null

  const evidence = result.data.evidence
  return {
    app: 'kamay',
    kind: 'entrega',
    exportedAt: result.data.exportedAt,
    project: project.data,
    python: result.data.python,
    missions: {
      completed: result.data.missions.completed as MissionId[],
      total: result.data.missions.total,
    },
    rubric: result.data.rubric as RubricEntry[],
    evidence: evidence
      ? {
          version: EVIDENCE_VERSION,
          misconceptions: evidence.misconceptions as MisconceptionId[],
          predictions: evidence.predictions as Evidence['predictions'],
          missionDates: (evidence.missionDates ?? {}) as Evidence['missionDates'],
        }
      : emptyEvidence(),
  }
}

export function exportDelivery(delivery: Delivery): Blob {
  return new Blob([`${JSON.stringify(delivery, null, 2)}\n`], { type: 'application/json' })
}

export function deliveryFileName(project: Project, now: Date = new Date()): string {
  return `${projectSlug(project)}-entrega-${now.toISOString().slice(0, 10)}.json`
}
