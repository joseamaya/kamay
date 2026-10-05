import {
  ACTOR_CATALOG,
  addCatalogObject,
  addEventAction,
  createEmptyProject,
  createId,
  createObject,
  createScene,
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
    inherits: options.inherits ?? 'Actor',
    image: null,
    attributes: [
      { name: 'color', type: 'string', initial: '#e2603a' },
      { name: 'shape', type: 'string', initial: 'circle' },
      ...(options.attributes ?? []),
    ],
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
  scene = addEventAction(scene, 'on_start', null, null, {
    target: name,
    method: 'decir',
    args: { mensaje: '¡Hola!' },
  })
  return projectWith('Saludo', scene)
}

function chase(): Project {
  let scene = addCatalogObject(createScene('Principal'), CARRO)
  scene = addCatalogObject(scene, BICICLETA)
  const [first, second] = scene.objects
  scene = addEventAction(scene, 'on_collision', first!.name, second!.name, {
    target: first!.name,
    method: 'decir',
    args: { mensaje: '¡Choque!' },
  })
  return projectWith('Choque', scene)
}

function ownClass(): Project {
  const heroe = klass('Heroe', {
    attributes: [{ name: 'vida', type: 'number', initial: 100 }],
    methods: [
      {
        name: 'saludar',
        parameters: [],
        body: { kind: 'code', code: 'self.decir("¡Hola!")' },
      },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [heroe] }
  let scene: Scene = {
    ...base,
    objects: [instance(base, 'Heroe', { color: '#e2603a', shape: 'circle', vida: 100 })],
  }
  const name = scene.objects[0]!.name
  scene = addEventAction(scene, 'on_start', null, null, {
    target: name,
    method: 'saludar',
    args: {},
  })
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
    objects: [
      instance(base, 'Heroe', { color: '#e2603a', shape: 'circle', vida: 100, fuerza: 10 }),
    ],
  }
  return projectWith('Herencia', scene)
}

function polymorphism(): Project {
  const animal = klass('SerVivo', {
    methods: [
      { name: 'hablar', parameters: [], body: { kind: 'code', code: 'self.decir("...")' } },
    ],
  })
  const perro = klass('Canino', {
    inherits: 'SerVivo',
    methods: [
      { name: 'hablar', parameters: [], body: { kind: 'code', code: 'self.decir("¡Guau!")' } },
    ],
  })
  const gato = klass('Felino', {
    inherits: 'SerVivo',
    methods: [
      { name: 'hablar', parameters: [], body: { kind: 'code', code: 'self.decir("¡Miau!")' } },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [animal, perro, gato] }
  let scene: Scene = {
    ...base,
    objects: [
      instance(base, 'Canino', { color: '#e2603a', shape: 'circle' }),
      instance(base, 'Felino', { color: '#8f9aa8', shape: 'circle' }),
    ],
  }
  const [perroObject, gatoObject] = scene.objects
  scene = addEventAction(scene, 'on_start', null, null, {
    target: perroObject!.name,
    method: 'hablar',
    args: {},
  })
  scene = addEventAction(scene, 'on_start', null, null, {
    target: gatoObject!.name,
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
      attributes: { ...object.attributes, y: 120 },
    })),
  })
}

function composition(): Project {
  const bateria = klass('Bateria', {
    attributes: [{ name: 'carga', type: 'number', initial: 100 }],
    methods: [{ name: 'cargar', parameters: [], body: { kind: 'code', code: 'self.carga = 100' } }],
  })
  const robot = klass('Maquina', {
    components: [{ name: 'bateria', class: 'Bateria' }],
    methods: [
      { name: 'saludar', parameters: [], body: { kind: 'code', code: 'self.decir("¡Hola!")' } },
    ],
  })
  const base: Scene = { ...createScene('Principal'), classes: [bateria, robot] }
  let scene: Scene = {
    ...base,
    objects: [instance(base, 'Maquina', { color: '#8f9aa8', shape: 'circle' })],
  }
  const name = scene.objects[0]!.name
  scene = addEventAction(scene, 'on_start', null, null, {
    target: name,
    method: 'saludar',
    args: {},
  })
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
