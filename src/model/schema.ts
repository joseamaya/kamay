import { z } from 'zod'

/** Current version of the persisted project model. Bump when the shape changes. */
export const CURRENT_SCHEMA_VERSION = 5

/** Identifier pattern shared by class and variable names in the generated Python. */
export const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/

export const attributeTypeSchema = z.enum(['number', 'string', 'boolean'])

export const parameterSchema = z.object({
  name: z.string().regex(identifierPattern, 'invalid_identifier'),
  type: attributeTypeSchema,
})

export const attributeSchema = z.object({
  name: z.string().regex(identifierPattern, 'invalid_identifier'),
  type: attributeTypeSchema,
  initial: z.union([z.number(), z.string(), z.boolean()]),
})

export interface Operation {
  id: string
  op: string
  args: Record<string, unknown>
  children: Operation[]
}

export const operationSchema: z.ZodType<Operation> = z.lazy(() =>
  z.object({
    id: z.string(),
    op: z.string().min(1),
    args: z.record(z.string(), z.unknown()).default({}),
    children: z.array(operationSchema).default([]),
  }),
)

export const methodBodySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('blocks'), ops: z.array(operationSchema).default([]) }),
  z.object({ kind: z.literal('code'), code: z.string() }),
])

export const methodSchema = z.object({
  name: z.string().regex(identifierPattern, 'invalid_identifier'),
  parameters: z.array(parameterSchema).default([]),
  body: methodBodySchema.default({ kind: 'blocks', ops: [] }),
})

export const classSchema = z.object({
  id: z.string(),
  name: z.string().regex(identifierPattern, 'invalid_identifier'),
  inherits: z.string().regex(identifierPattern, 'invalid_identifier').nullable().default(null),
  image: z.string().nullable().default(null),
  attributes: z.array(attributeSchema).default([]),
  methods: z.array(methodSchema).default([]),
})

export const objectSchema = z.object({
  id: z.string(),
  name: z.string().regex(identifierPattern, 'invalid_identifier'),
  class: z.string().regex(identifierPattern, 'invalid_identifier'),
  attributes: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
})

export const actionSchema = z.object({
  target: z.string(),
  method: z.string().regex(identifierPattern, 'invalid_identifier'),
  args: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).default({}),
})

export const eventTypeSchema = z.enum([
  'on_start',
  'on_collision',
  'on_click',
  'on_key',
  'on_signal',
])

export const eventSchema = z.object({
  type: eventTypeSchema,
  /** Object id or name that triggers the event (click/collision/key/signal); null for on_start. */
  source: z.string().nullable().default(null),
  /** Second object of a collision; null otherwise. */
  other: z.string().nullable().default(null),
  /** Key that triggers an `on_key` event; null otherwise. */
  key: z.string().nullable().default(null),
  /** Signal name for an `on_signal` event; null otherwise. */
  signal: z.string().nullable().default(null),
  actions: z.array(actionSchema).default([]),
})

export const physicsSchema = z.object({
  enabled: z.boolean().default(false),
  gravityY: z.number().default(-9.8),
})

export const sceneSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  background: z.string().default('grass'),
  physics: physicsSchema.default({ enabled: false, gravityY: -9.8 }),
  classes: z.array(classSchema).default([]),
  objects: z.array(objectSchema).default([]),
  events: z.array(eventSchema).default([]),
})

export const projectMetaSchema = z.object({
  name: z.string().min(1),
  author: z.string().default(''),
  created: z.string().default(() => new Date().toISOString()),
})

export const projectSchema = z
  .object({
    version: z.number().int().positive(),
    meta: projectMetaSchema,
    scenes: z.array(sceneSchema).min(1),
  })
  .superRefine((project, ctx) => {
    if (project.version > CURRENT_SCHEMA_VERSION) {
      ctx.addIssue({
        code: 'custom',
        message: 'unsupported_schema_version',
        path: ['version'],
      })
    }
  })

export type AttributeType = z.infer<typeof attributeTypeSchema>
export type Parameter = z.infer<typeof parameterSchema>
export type Attribute = z.infer<typeof attributeSchema>
export type MethodBody = z.infer<typeof methodBodySchema>
export type Method = z.infer<typeof methodSchema>
export type ClassDefinition = z.infer<typeof classSchema>
export type ObjectInstance = z.infer<typeof objectSchema>
export type Action = z.infer<typeof actionSchema>
export type EventType = z.infer<typeof eventTypeSchema>
export type SceneEvent = z.infer<typeof eventSchema>
export type PhysicsConfig = z.infer<typeof physicsSchema>
export type Scene = z.infer<typeof sceneSchema>
export type ProjectMeta = z.infer<typeof projectMetaSchema>
export type Project = z.infer<typeof projectSchema>
