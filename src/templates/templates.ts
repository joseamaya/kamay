import {
  ACTOR_CATALOG,
  addCatalogObject,
  addOrder,
  createEmptyProject,
  createId,
  createObject,
  createScene,
  createSetBlock,
} from '../model'
import type {
  Attribute,
  ClassDefinition,
  Component,
  Method,
  ObjectInstance,
  Project,
  Scene,
} from '../model'

export type TemplateId =
  'hello' | 'chase' | 'own_class' | 'inheritance' | 'polymorphism' | 'physics' | 'composition'

export interface Template {
  id: TemplateId
  build: () => Project
}

const CARRO = ACTOR_CATALOG.find((item) => item.id === 'carro')!
const BICICLETA = ACTOR_CATALOG.find((item) => item.id === 'bicicleta')!
const PELOTA = ACTOR_CATALOG.find((item) => item.id === 'pelota')!

function projectWith(name: string, scene: Scene): Project {
  return { ...createEmptyProject({ name }), scenes: [scene] }
}

function klass(
  name: string,
  options: {
    inherits?: string
    attributes?: Attribute[]
    components?: Component[]
    methods?: Method[]
  } = {},
): ClassDefinition {
  return {
    id: createId('class'),
    name,
    inherits: options.inherits ?? null,
    appearance: { color: '#e2603a', shape: 'circle', glyph: null },
    image: null,
    attributes: options.attributes ?? [],
    components: options.components ?? [],
    methods: options.methods ?? [],
    visuals: [],
  }
}

function instance(
  scene: Scene,
  className: string,
  attributes: Record<string, number | string | boolean> = {},
): ObjectInstance {
  return createObject(scene, className, attributes)
}

function hello(): Project {
  let scene = addCatalogObject(createScene('Principal'), CARRO)
  const name = scene.objects[0]!.name
  scene = addOrder(scene, { target: name, method: 'tocar_bocina', args: {} })
  return projectWith('Saludo', scene)
}

function chase(): Project {
  let scene = addCatalogObject(createScene('Principal'), CARRO)
  scene = addCatalogObject(scene, BICICLETA)
  const [first] = scene.objects
  scene = addOrder(scene, { target: first!.name, method: 'tocar_bocina', args: {} })
  return projectWith('Dos objetos', scene)
}

function ownClass(): Project {
  const heroe = klass('Heroe', {
    attributes: [
      { name: 'vida', type: 'number', initial: 100 },
      { name: 'sonido', type: 'string', initial: '' },
    ],
    methods: [
      {
        name: 'saludar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '¡Hola!')] },
      },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [heroe] }
  let scene: Scene = {
    ...base,
    objects: [instance(base, 'Heroe', { vida: 100 })],
  }
  const name = scene.objects[0]!.name
  scene = addOrder(scene, { target: name, method: 'saludar', args: {} })
  return projectWith('Mi clase', scene)
}

function inheritance(): Project {
  const personaje = klass('Personaje', {
    attributes: [{ name: 'vida', type: 'number', initial: 100 }],
  })
  const heroe = klass('Heroe', {
    inherits: 'Personaje',
    attributes: [{ name: 'fuerza', type: 'number', initial: 10 }],
  })
  const base: Scene = { ...createScene('Principal'), classes: [personaje, heroe] }
  const scene: Scene = {
    ...base,
    objects: [instance(base, 'Heroe', { vida: 100, fuerza: 10 })],
  }
  return projectWith('Herencia', scene)
}

function polymorphism(): Project {
  const animal = klass('SerVivo', {
    attributes: [{ name: 'sonido', type: 'string', initial: '' }],
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '...')] },
      },
    ],
  })
  const perro = klass('Canino', {
    inherits: 'SerVivo',
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '¡Guau!')] },
      },
    ],
  })
  const gato = klass('Felino', {
    inherits: 'SerVivo',
    methods: [
      {
        name: 'hablar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '¡Miau!')] },
      },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [animal, perro, gato] }
  let scene: Scene = {
    ...base,
    objects: [instance(base, 'Canino', {}), instance(base, 'Felino', {})],
  }
  scene = addOrder(scene, {
    kind: 'for_each',
    target: '',
    class: 'SerVivo',
    variable: 'ser',
    method: 'hablar',
    args: {},
  })
  return projectWith('Polimorfismo', scene)
}

function physics(): Project {
  const scene = addCatalogObject(createScene('Principal'), PELOTA)
  return projectWith('Física', {
    ...scene,
    background: 'sky',
    physics: { enabled: true, gravityY: -9.8 },
    objects: scene.objects.map((object) => ({
      ...object,
      attributes: { ...object.attributes, altura: 120 },
    })),
  })
}

function composition(): Project {
  const bateria = klass('Bateria', {
    attributes: [{ name: 'carga', type: 'number', initial: 100 }],
    methods: [
      {
        name: 'cargar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('carga', 100)] },
      },
    ],
  })
  const robot = klass('Maquina', {
    components: [{ name: 'bateria', class: 'Bateria' }],
    attributes: [{ name: 'sonido', type: 'string', initial: '' }],
    methods: [
      {
        name: 'saludar',
        parameters: [],
        body: { kind: 'blocks', ops: [createSetBlock('sonido', '¡Hola!')] },
      },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [bateria, robot] }
  let scene: Scene = {
    ...base,
    objects: [instance(base, 'Maquina', {})],
  }
  const name = scene.objects[0]!.name
  scene = addOrder(scene, { target: name, method: 'saludar', args: {} })
  return projectWith('Composición', scene)
}

export const TEMPLATES: Template[] = [
  { id: 'hello', build: hello },
  { id: 'chase', build: chase },
  { id: 'own_class', build: ownClass },
  { id: 'inheritance', build: inheritance },
  { id: 'polymorphism', build: polymorphism },
  { id: 'physics', build: physics },
  { id: 'composition', build: composition },
]

export function findTemplate(id: TemplateId): Template | undefined {
  return TEMPLATES.find((template) => template.id === id)
}
