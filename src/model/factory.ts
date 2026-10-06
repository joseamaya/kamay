import type { AttributeValue } from './attributes'
import { createId } from './ids'
import type {
  Action,
  Appearance,
  Attribute,
  ClassDefinition,
  EventType,
  Method,
  ObjectInstance,
  Operation,
  Project,
  Scene,
  Simulation,
} from './schema'

export type ActorShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'heart'
  | 'star'

export const ACTOR_SHAPES: ActorShape[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'diamond',
  'pentagon',
  'hexagon',
  'heart',
  'star',
]

export type CatalogKind = 'shape' | 'glyph'

export type CatalogGroup = 'vehiculos' | 'animales' | 'cosas'

export interface CatalogItem {
  id: string
  className: string
  kind: CatalogKind
  shape: ActorShape
  glyph?: string
  color: string
  /** Real-world group the entity belongs to. */
  group?: CatalogGroup
  /** Domain base class the entity inherits from. */
  base?: string
  /** Entity's own attributes beyond the visual ones. */
  attributes?: Attribute[]
  /** Entity's own methods. */
  methods?: Method[]
}

function domainBlockMethod(name: string, ops: Operation[]): Method {
  return { name, parameters: [], body: { kind: 'blocks', ops } }
}

function setOp(name: string, value: AttributeValue): Operation {
  return { id: createId('block'), op: 'set', args: { name, value }, children: [] }
}

function changeOp(name: string, amount: number, operator: '+' | '-' = '+'): Operation {
  return { id: createId('block'), op: 'change', args: { name, operator, amount }, children: [] }
}

const VEHICULO: ClassDefinition = {
  id: 'base-vehiculo',
  name: 'Vehiculo',
  inherits: null,
  appearance: { color: '#e2603a', shape: null, glyph: null },
  image: null,
  attributes: [
    { name: 'marca', type: 'string', initial: '' },
    { name: 'modelo', type: 'string', initial: '' },
    { name: 'encendido', type: 'boolean', initial: false },
    { name: 'distancia', type: 'number', initial: 0 },
    { name: 'sonido', type: 'string', initial: '' },
  ],
  components: [],
  methods: [
    domainBlockMethod('prender', [setOp('encendido', true)]),
    domainBlockMethod('apagar', [setOp('encendido', false)]),
    domainBlockMethod('moverse', [changeOp('distancia', 50)]),
  ],
  visuals: [
    {
      id: 'variant-vehiculo-prendido',
      name: 'Prendido',
      when: [{ attribute: 'encendido', value: true }],
      glyph: null,
      image: null,
      color: '#f4c542',
      shape: null,
    },
  ],
}

const ANIMAL: ClassDefinition = {
  id: 'base-animal',
  name: 'Animal',
  inherits: null,
  appearance: { color: '#e0a23c', shape: null, glyph: null },
  image: null,
  attributes: [
    { name: 'nombre', type: 'string', initial: '' },
    { name: 'energia', type: 'number', initial: 50 },
    { name: 'altura', type: 'number', initial: 0 },
    { name: 'sonido', type: 'string', initial: '' },
  ],
  components: [],
  methods: [
    domainBlockMethod('comer', [changeOp('energia', 10)]),
    domainBlockMethod('dormir', [changeOp('energia', 20)]),
  ],
  visuals: [],
}

const COSA: ClassDefinition = {
  id: 'base-cosa',
  name: 'Cosa',
  inherits: null,
  appearance: { color: '#8f9aa8', shape: null, glyph: null },
  image: null,
  attributes: [
    { name: 'nombre', type: 'string', initial: '' },
    { name: 'distancia', type: 'number', initial: 0 },
    { name: 'altura', type: 'number', initial: 0 },
    { name: 'sonido', type: 'string', initial: '' },
  ],
  components: [],
  methods: [],
  visuals: [],
}

/** Domain base classes provided by the catalog (system classes). */
export const DOMAIN_BASES: Record<string, ClassDefinition> = {
  Vehiculo: VEHICULO,
  Animal: ANIMAL,
  Cosa: COSA,
}

export const DOMAIN_BASE_NAMES: string[] = Object.keys(DOMAIN_BASES)

const DOMAIN_CATALOG: CatalogItem[] = [
  {
    id: 'carro',
    className: 'Carro',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🚗',
    color: '#d64b4b',
    group: 'vehiculos',
    base: 'Vehiculo',
    attributes: [{ name: 'anio', type: 'number', initial: 2024 }],
    methods: [domainBlockMethod('tocar_bocina', [setOp('sonido', '¡Beep!')])],
  },
  {
    id: 'bicicleta',
    className: 'Bicicleta',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🚲',
    color: '#3f9a86',
    group: 'vehiculos',
    base: 'Vehiculo',
    attributes: [{ name: 'rodado', type: 'number', initial: 26 }],
    methods: [domainBlockMethod('pedalear', [changeOp('distancia', 30)])],
  },
  {
    id: 'moto',
    className: 'Moto',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🏍️',
    color: '#8f9aa8',
    group: 'vehiculos',
    base: 'Vehiculo',
    attributes: [{ name: 'cilindrada', type: 'number', initial: 150 }],
    methods: [domainBlockMethod('acelerar', [changeOp('distancia', 80)])],
  },
  {
    id: 'perro',
    className: 'Perro',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🐶',
    color: '#c98a4b',
    group: 'animales',
    base: 'Animal',
    methods: [domainBlockMethod('ladrar', [setOp('sonido', '¡Guau!')])],
  },
  {
    id: 'gato',
    className: 'Gato',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🐱',
    color: '#e0a23c',
    group: 'animales',
    base: 'Animal',
    methods: [domainBlockMethod('maullar', [setOp('sonido', '¡Miau!')])],
  },
  {
    id: 'pajaro',
    className: 'Pajaro',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🐦',
    color: '#5b8def',
    group: 'animales',
    base: 'Animal',
    methods: [domainBlockMethod('volar', [changeOp('altura', 80)])],
  },
  {
    id: 'casa',
    className: 'Casa',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🏠',
    color: '#c98a4b',
    group: 'cosas',
    base: 'Cosa',
  },
  {
    id: 'arbol',
    className: 'Arbol',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🌳',
    color: '#3f9a86',
    group: 'cosas',
    base: 'Cosa',
  },
  {
    id: 'robot',
    className: 'Robot',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🤖',
    color: '#8f9aa8',
    group: 'cosas',
    base: 'Cosa',
    methods: [domainBlockMethod('saludar', [setOp('sonido', '¡Hola!')])],
  },
  {
    id: 'cohete',
    className: 'Cohete',
    kind: 'glyph',
    shape: 'circle',
    glyph: '🚀',
    color: '#5b8def',
    group: 'cosas',
    base: 'Cosa',
    methods: [domainBlockMethod('despegar', [changeOp('altura', 120)])],
  },
  {
    id: 'pelota',
    className: 'Pelota',
    kind: 'glyph',
    shape: 'circle',
    glyph: '⚽',
    color: '#3f9a86',
    group: 'cosas',
    base: 'Cosa',
    methods: [domainBlockMethod('rodar', [changeOp('distancia', 60)])],
  },
]

export const ACTOR_CATALOG: CatalogItem[] = DOMAIN_CATALOG

/** Names of the classes provided by the app (catalog entities and domain bases). */
export const SYSTEM_CLASS_NAMES = new Set<string>([
  ...ACTOR_CATALOG.map((item) => item.className),
  ...DOMAIN_BASE_NAMES,
])

export function isSystemClassName(name: string): boolean {
  return SYSTEM_CLASS_NAMES.has(name)
}

export function isDomainBaseName(name: string): boolean {
  return name in DOMAIN_BASES
}

/**
 * Adds the domain bases a class inherits but that are not placed in the scene,
 * mirroring what the generator emits, so resolution and simulation see them.
 */
export function withDomainBases(scene: Scene): Scene {
  const names = new Set(scene.classes.map((definition) => definition.name))
  const extra: ClassDefinition[] = []
  for (const definition of scene.classes) {
    const base = definition.inherits
    if (base && !names.has(base) && base in DOMAIN_BASES) {
      extra.push(DOMAIN_BASES[base]!)
      names.add(base)
    }
  }
  return extra.length > 0 ? { ...scene, classes: [...scene.classes, ...extra] } : scene
}

/** Order-independent key for a pair of objects that can collide. */
export function collisionKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

export const DEFAULT_SIMULATION = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  mensaje: '',
}

export function findCatalogItem(id: string): CatalogItem | undefined {
  return ACTOR_CATALOG.find((item) => item.id === id)
}

export function isActorShape(value: unknown): value is ActorShape {
  return typeof value === 'string' && (ACTOR_SHAPES as string[]).includes(value)
}

export function catalogClass(item: CatalogItem): ClassDefinition {
  return {
    id: createId('class'),
    name: item.className,
    inherits: item.base ?? null,
    // Domain entities inherit their color from the base; abstract items own it.
    appearance: {
      color: item.base ? null : item.color,
      shape: item.shape,
      glyph: item.glyph ?? null,
    },
    image: null,
    attributes: item.attributes ?? [],
    components: [],
    methods: item.methods ?? [],
    visuals: [],
  }
}

export function nextObjectName(scene: Scene, className: string): string {
  const base = className.toLowerCase()
  let index = 1
  const names = new Set(scene.objects.map((object) => object.name))
  while (names.has(`${base}${index}`)) index += 1
  return `${base}${index}`
}

export function createObject(
  scene: Scene,
  className: string,
  attributes: Record<string, number | string | boolean> = {},
  appearance: Appearance = { color: null, shape: null, glyph: null },
  simulation: Simulation = { ...DEFAULT_SIMULATION },
): ObjectInstance {
  return {
    id: createId('object'),
    name: nextObjectName(scene, className),
    class: className,
    appearance,
    simulation,
    attributes: { ...attributes },
  }
}

export function createObjectFromCatalog(scene: Scene, item: CatalogItem): ObjectInstance {
  return createObject(
    scene,
    item.className,
    {},
    { color: item.color, shape: item.shape, glyph: item.glyph ?? null },
  )
}

/** Adds the catalog object and its class chain (domain base included) to the scene. */
export function addCatalogObject(scene: Scene, item: CatalogItem): Scene {
  let classes = scene.classes
  if (item.base && !classes.some((definition) => definition.name === item.base)) {
    const base = DOMAIN_BASES[item.base]
    if (base) classes = [...classes, base]
  }
  if (!classes.some((definition) => definition.name === item.className)) {
    classes = [...classes, catalogClass(item)]
  }
  return { ...scene, classes, objects: [...scene.objects, createObjectFromCatalog(scene, item)] }
}

export function removeObject(scene: Scene, objectId: string): Scene {
  const target = scene.objects.find((object) => object.id === objectId)
  if (!target) return scene

  const identifiers = new Set([target.id, target.name])
  return {
    ...scene,
    objects: scene.objects.filter((object) => object.id !== objectId),
    events: scene.events
      .map((event) => ({
        ...event,
        actions: event.actions.filter((action) => !identifiers.has(action.target)),
      }))
      .filter(
        (event) =>
          !(event.source && identifiers.has(event.source)) &&
          !(event.other && identifiers.has(event.other)),
      ),
  }
}

export function updateObjectAttributes(
  scene: Scene,
  objectId: string,
  patch: Record<string, number | string | boolean>,
): Scene {
  return {
    ...scene,
    objects: scene.objects.map((object) =>
      object.id === objectId
        ? { ...object, attributes: { ...object.attributes, ...patch } }
        : object,
    ),
  }
}

export function updateObjectAppearance(
  scene: Scene,
  objectId: string,
  patch: Partial<Appearance>,
): Scene {
  return {
    ...scene,
    objects: scene.objects.map((object) =>
      object.id === objectId
        ? { ...object, appearance: { ...object.appearance, ...patch } }
        : object,
    ),
  }
}

export function updateObjectSimulation(
  scene: Scene,
  objectId: string,
  patch: Partial<Simulation>,
): Scene {
  return {
    ...scene,
    objects: scene.objects.map((object) =>
      object.id === objectId
        ? { ...object, simulation: { ...object.simulation, ...patch } }
        : object,
    ),
  }
}

export function setSceneBackground(scene: Scene, background: string): Scene {
  return { ...scene, background }
}

export function setScenePhysics(scene: Scene, patch: Partial<Scene['physics']>): Scene {
  return { ...scene, physics: { ...scene.physics, ...patch } }
}

export function renameProject(project: Project, name: string): Project {
  return { ...project, meta: { ...project.meta, name } }
}

interface EventIdentity {
  eventType: EventType
  source: string | null
  other: string | null
  key: string | null
}

function sameTrigger(event: Scene['events'][number], identity: EventIdentity) {
  return (
    event.type === identity.eventType &&
    (event.source ?? null) === (identity.source ?? null) &&
    (event.other ?? null) === (identity.other ?? null) &&
    (event.key ?? null) === (identity.key ?? null)
  )
}

export function findEvent(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null = null,
  key: string | null = null,
): Scene['events'][number] | undefined {
  return scene.events.find((event) => sameTrigger(event, { eventType, source, other, key }))
}

export function addEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  action: Action,
  key: string | null = null,
): Scene {
  const identity = { eventType, source, other, key }
  const events = [...scene.events]
  const index = events.findIndex((event) => sameTrigger(event, identity))
  if (index >= 0) {
    const event = events[index]!
    events[index] = { ...event, actions: [...event.actions, action] }
  } else {
    events.push({
      type: eventType,
      source: source ?? null,
      other: other ?? null,
      key: key ?? null,
      actions: [action],
    })
  }
  return { ...scene, events }
}

/** Updates a single argument of an existing action, keyed by its trigger. */
export function setActionArg(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  actionIndex: number,
  parameter: string,
  value: number | string | boolean,
  key: string | null = null,
): Scene {
  const event = findEvent(scene, eventType, source, other, key)
  if (!event) return scene
  const events = scene.events.map((candidate) =>
    candidate === event
      ? {
          ...candidate,
          actions: candidate.actions.map((action, index) =>
            index === actionIndex
              ? { ...action, args: { ...action.args, [parameter]: value } }
              : action,
          ),
        }
      : candidate,
  )
  return { ...scene, events }
}

export function removeEventAction(
  scene: Scene,
  eventType: EventType,
  source: string | null,
  other: string | null,
  actionIndex: number,
  key: string | null = null,
): Scene {
  const identity = { eventType, source, other, key }
  return {
    ...scene,
    events: scene.events.map((event) =>
      sameTrigger(event, identity)
        ? { ...event, actions: event.actions.filter((_, index) => index !== actionIndex) }
        : event,
    ),
  }
}

export function replaceScene(project: Project, scene: Scene): Project {
  return {
    ...project,
    scenes: project.scenes.map((current) => (current.id === scene.id ? scene : current)),
  }
}
