import { describe, expect, it } from 'vitest'

import { ACTOR_CATALOG, addCatalogObject, createEmptyProject, createScene } from '../model'
import type { Project } from '../model'
import { projectSchema } from '../model'
import { generatePython, symbolAtLine } from './generatePython'

function buildFixture(): Project {
  return projectSchema.parse({
    version: 12,
    meta: { name: 'Mi primer juego', author: 'Ada', created: '2026-01-01T00:00:00.000Z' },
    scenes: [
      {
        id: 'scene-1',
        name: 'Principal',
        background: 'grass',
        classes: [
          {
            id: 'class-heroe',
            name: 'Heroe',
            attributes: [{ name: 'vida', type: 'number', initial: 100 }],
            methods: [
              {
                name: 'saltar',
                parameters: [{ name: 'mensaje', type: 'string' }],
                body: { kind: 'blocks', ops: [] },
              },
            ],
          },
        ],
        objects: [{ id: 'h1', name: 'h1', class: 'Heroe', attributes: { vida: 50 } }],
        orders: [{ target: 'h1', method: 'saltar', args: { mensaje: '¡Hola!' } }],
      },
    ],
  })
}

describe('generatePython', () => {
  it('generates one file per class plus principal.py', () => {
    const { files } = generatePython(buildFixture())
    expect(files.map((file) => file.path)).toEqual(['Heroe.py', 'principal.py'])
  })

  it('emits a domain base that is only inherited', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'X' },
      scenes: [
        {
          id: 's',
          name: 'Principal',
          classes: [{ id: 'c', name: 'Heroe', inherits: 'Cosa', attributes: [], methods: [] }],
        },
      ],
    })

    const { files } = generatePython(project)

    expect(files.map((file) => file.path)).toContain('Cosa.py')
    expect(files.find((file) => file.path === 'Heroe.py')?.content).toContain(
      'from Cosa import Cosa',
    )
  })

  it('generates an attribute change from a change block', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 's',
          name: 'Principal',
          classes: [
            {
              id: 'c',
              name: 'Animal',
              attributes: [{ name: 'energia', type: 'number', initial: 50 }],
              methods: [
                {
                  name: 'comer',
                  body: {
                    kind: 'blocks',
                    ops: [
                      {
                        id: 'b',
                        op: 'change',
                        args: { name: 'energia', operator: '+', amount: 10 },
                        children: [],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    const animal = generatePython(project).files.find((file) => file.path === 'Animal.py')
    expect(animal?.content).toContain('self.energia = self.energia + 10')
  })

  it('generates the same Python for catalog block methods', () => {
    const carro = ACTOR_CATALOG.find((item) => item.id === 'carro')!
    const scene = addCatalogObject(createScene('Principal'), carro)
    const project = { ...createEmptyProject(), scenes: [scene] }
    const files = generatePython(project).files

    const vehiculo = files.find((file) => file.path === 'Vehiculo.py')?.content ?? ''
    expect(vehiculo).toContain('self.encendido = True')
    expect(vehiculo).toContain('self.distancia = self.distancia + 50')
    expect(files.find((file) => file.path === 'Carro.py')?.content).toContain(
      'self.sonido = "¡Beep!"',
    )
  })

  it('generates a for-each loop over a class and its subclasses', () => {
    const project = projectSchema.parse({
      version: 9,
      meta: { name: 'X' },
      scenes: [
        {
          id: 's',
          name: 'Principal',
          classes: [
            {
              id: 'c-perro',
              name: 'Perro',
              inherits: 'Animal',
              methods: [{ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } }],
            },
            {
              id: 'c-gato',
              name: 'Gato',
              inherits: 'Animal',
              methods: [{ name: 'hablar', parameters: [], body: { kind: 'blocks', ops: [] } }],
            },
          ],
          objects: [
            { id: 'o1', name: 'perro1', class: 'Perro' },
            { id: 'o2', name: 'gato1', class: 'Gato' },
          ],
          orders: [
            {
              kind: 'for_each',
              target: '',
              class: 'Animal',
              variable: 'animal',
              method: 'hablar',
              args: {},
            },
          ],
        },
      ],
    })

    const main =
      generatePython(project).files.find((file) => file.path === 'principal.py')?.content ?? ''

    expect(main).toContain('for animal in [perro1, gato1]:')
    expect(main).toContain('animal.hablar()')
  })

  it('generates the expected Heroe.py (golden)', () => {
    const { files } = generatePython(buildFixture())
    const heroe = files.find((file) => file.path === 'Heroe.py')

    expect(heroe?.content).toBe(`# -*- coding: utf-8 -*-
# Clase Heroe

class Heroe:
    def __init__(self, name=None):
        self.vida = 100

    def saltar(self, mensaje: str):
        pass
`)
  })

  it('generates the expected principal.py (golden)', () => {
    const { files } = generatePython(buildFixture())
    const main = files.find((file) => file.path === 'principal.py')

    expect(main?.content).toBe(`# -*- coding: utf-8 -*-
# Proyecto: Mi primer juego
# Autor: Ada
# Generado por Kamay. Se regenera desde el modelo JSON; no edites a mano.

from Heroe import Heroe

def main():
    # Escena: Principal
    h1 = Heroe("h1")
    h1.vida = 50
    h1.saltar("¡Hola!")


if __name__ == "__main__":
    main()
`)
  })

  it('orders action arguments by the method parameter order', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'class-heroe',
              name: 'Heroe',
              methods: [
                {
                  name: 'mover',
                  parameters: [
                    { name: 'x', type: 'number' },
                    { name: 'y', type: 'number' },
                  ],
                },
              ],
            },
          ],
          objects: [{ id: 'h1', name: 'h1', class: 'Heroe' }],
          orders: [{ target: 'h1', method: 'mover', args: { y: 2, x: 1 } }],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('h1.mover(1, 2)')
  })

  it('generates a user class with a code method and its call', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'class-heroe',
              name: 'Heroe',
              attributes: [{ name: 'vida', type: 'number', initial: 100 }],
              methods: [
                {
                  name: 'saludar',
                  parameters: [{ name: 'mensaje', type: 'string' }],
                  body: { kind: 'code', code: 'self.decir(mensaje)' },
                },
              ],
            },
          ],
          objects: [{ id: 'o1', name: 'heroe1', class: 'Heroe' }],
          orders: [{ target: 'heroe1', method: 'saludar', args: { mensaje: 'hola' } }],
        },
      ],
    })

    const files = generatePython(project).files
    const heroe = files.find((file) => file.path === 'Heroe.py')
    expect(heroe?.content).toContain('def saludar(self, mensaje: str):')
    expect(heroe?.content).toContain('self.decir(mensaje)')

    const main = files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('heroe1.saludar("hola")')
  })

  it('emits per-instance attribute assignments', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'class-heroe',
              name: 'Heroe',
              attributes: [{ name: 'vida', type: 'number', initial: 100 }],
            },
          ],
          objects: [
            { id: 'o1', name: 'heroe1', class: 'Heroe', attributes: { vida: 50 } },
            { id: 'o2', name: 'heroe2', class: 'Heroe', attributes: { vida: 100 } },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('heroe1.vida = 50')
    expect(main?.content).toContain('heroe2.vida = 100')
  })

  it('imports the base class when inheriting from another class', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            { id: 'class-animal', name: 'Animal' },
            { id: 'class-perro', name: 'Perro', inherits: 'Animal' },
          ],
        },
      ],
    })

    const perro = generatePython(project).files.find((file) => file.path === 'Perro.py')
    expect(perro?.content).toContain('from Animal import Animal')
    expect(perro?.content).toContain('class Perro(Animal):')
  })

  it('chains inheritance across three levels', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            { id: 'class-personaje', name: 'Personaje' },
            { id: 'class-heroe', name: 'Heroe', inherits: 'Personaje' },
          ],
        },
      ],
    })

    const files = generatePython(project).files
    const personaje = files.find((file) => file.path === 'Personaje.py')
    const heroe = files.find((file) => file.path === 'Heroe.py')

    expect(personaje?.content).toContain('class Personaje:')
    expect(heroe?.content).toContain('from Personaje import Personaje')
    expect(heroe?.content).toContain('class Heroe(Personaje):')
  })

  it('compiles method blocks into Python statements', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'class-heroe',
              name: 'Heroe',
              attributes: [{ name: 'vida', type: 'number', initial: 100 }],
              methods: [
                {
                  name: 'saludar',
                  parameters: [{ name: 'mensaje', type: 'string' }],
                  body: { kind: 'blocks', ops: [] },
                },
                {
                  name: 'mover_a',
                  parameters: [
                    { name: 'x', type: 'number' },
                    { name: 'y', type: 'number' },
                  ],
                  body: { kind: 'blocks', ops: [] },
                },
                {
                  name: 'rutina',
                  parameters: [],
                  body: {
                    kind: 'blocks',
                    ops: [
                      { id: 'b1', op: 'set', args: { name: 'vida', value: 50 } },
                      {
                        id: 'b2',
                        op: 'call',
                        args: { method: 'saludar', values: { mensaje: 'hola' } },
                      },
                      {
                        id: 'b3',
                        op: 'repeat',
                        args: { times: 2 },
                        children: [
                          {
                            id: 'b4',
                            op: 'call',
                            args: { method: 'mover_a', values: { x: 1, y: 2 } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    const heroe = generatePython(project).files.find((file) => file.path === 'Heroe.py')
    expect(heroe?.content).toContain('    def rutina(self):')
    expect(heroe?.content).toContain('        self.vida = 50')
    expect(heroe?.content).toContain('        self.saludar("hola")')
    expect(heroe?.content).toContain('        for _ in range(2):')
    expect(heroe?.content).toContain('            self.mover_a(1, 2)')
  })

  it('emits advanced code blocks verbatim', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'class-heroe',
              name: 'Heroe',
              methods: [
                {
                  name: 'rutina',
                  parameters: [],
                  body: {
                    kind: 'blocks',
                    ops: [{ id: 'b1', op: 'code', args: { code: 'if True:\n    pass' } }],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    const heroe = generatePython(project).files.find((file) => file.path === 'Heroe.py')
    expect(heroe?.content).toContain('        if True:')
    expect(heroe?.content).toContain('            pass')
  })

  it('is deterministic for the same model', () => {
    const first = generatePython(buildFixture())
    const second = generatePython(buildFixture())
    expect(first).toEqual(second)
  })
})

describe('editableValues', () => {
  it('locates object attributes and order arguments', () => {
    const { files, editableValues } = generatePython(buildFixture())
    const main = files.find((file) => file.path === 'principal.py')!.content

    const attribute = editableValues.find(
      (value) => value.kind === 'attribute' && value.key === 'vida',
    )!
    expect(attribute.objectName).toBe('h1')
    expect(attribute.value).toBe(50)
    expect(main.slice(attribute.from, attribute.to)).toBe('50')

    const argument = editableValues.find((value) => value.kind === 'action-arg')!
    expect(argument.key).toBe('mensaje')
    expect(argument.orderIndex).toBe(0)
    expect(argument.value).toBe('¡Hola!')
    expect(main.slice(argument.from, argument.to)).toBe('"¡Hola!"')
  })

  it('keeps the generated content clean and every range valid', () => {
    const { files, editableValues } = generatePython(buildFixture())
    const main = files.find((file) => file.path === 'principal.py')!.content

    expect(main).not.toContain('\u0001')
    expect(main).not.toContain('\u0002')
    for (const value of editableValues) {
      expect(value.from).toBeLessThan(value.to)
      expect(value.to).toBeLessThanOrEqual(main.length)
    }
  })
})

describe('composition', () => {
  const project = projectSchema.parse({
    version: 1,
    meta: { name: 'Robot' },
    scenes: [
      {
        id: 'scene-1',
        name: 'Principal',
        classes: [
          {
            id: 'c-robot',
            name: 'Robot',
            attributes: [],
            components: [{ name: 'bateria', class: 'Bateria' }],
          },
        ],
        objects: [{ id: 'r1', name: 'r1', class: 'Robot' }],
      },
    ],
  })

  it('imports the component class and instantiates it in __init__', () => {
    const { files } = generatePython(project)
    const robot = files.find((file) => file.path === 'Robot.py')

    expect(robot?.content).toContain('from Bateria import Bateria')
    expect(robot?.content).toContain('self.bateria = Bateria("bateria")')
  })
})

describe('symbols', () => {
  function lineOf(content: string, needle: string): number {
    return content.split('\n').findIndex((line) => line.includes(needle)) + 1
  }

  it('locates class members and scene entities in the generated files', () => {
    const { files, symbols } = generatePython(buildFixture())
    const heroe = files.find((file) => file.path === 'Heroe.py')!.content
    const principal = files.find((file) => file.path === 'principal.py')!.content

    const classSymbol = symbols.find((symbol) => symbol.kind === 'class')!
    expect(classSymbol.file).toBe('Heroe.py')
    expect(classSymbol.lineFrom).toBe(lineOf(heroe, 'class Heroe'))

    const attribute = symbols.find((symbol) => symbol.kind === 'attribute')!
    expect(attribute.member).toBe('vida')
    expect(attribute.lineFrom).toBe(lineOf(heroe, 'self.vida = 100'))

    const method = symbols.find((symbol) => symbol.kind === 'method')!
    expect(method.member).toBe('saltar')
    expect(method.lineFrom).toBe(lineOf(heroe, 'def saltar'))
    expect(heroe.split('\n')[method.lineTo - 1]).toContain('pass')

    const object = symbols.find((symbol) => symbol.kind === 'object')!
    expect(object.file).toBe('principal.py')
    expect(object.objectName).toBe('h1')
    expect(object.lineFrom).toBe(lineOf(principal, 'h1 = Heroe("h1")'))
    expect(object.lineTo).toBe(lineOf(principal, 'h1.vida = 50'))

    const order = symbols.find((symbol) => symbol.kind === 'order')!
    expect(order.orderIndex).toBe(0)
    expect(order.member).toBe('saltar')
    expect(order.lineFrom).toBe(lineOf(principal, 'h1.saltar('))
    expect(order.lineTo).toBe(order.lineFrom)
  })

  it('locates components and the __init__ block', () => {
    const composed = projectSchema.parse({
      version: 1,
      meta: { name: 'Robot' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [
            {
              id: 'c-robot',
              name: 'Robot',
              attributes: [],
              components: [{ name: 'bateria', class: 'Bateria' }],
            },
          ],
          objects: [{ id: 'r1', name: 'r1', class: 'Robot' }],
        },
      ],
    })
    const { symbols } = generatePython(composed)
    const init = symbols.find((symbol) => symbol.kind === 'init')!
    const component = symbols.find((symbol) => symbol.kind === 'component')!

    expect(init.className).toBe('Robot')
    expect(component.member).toBe('bateria')
    expect(component.lineFrom).toBe(init.lineFrom + 1)
  })

  it('maps a line back to its most specific symbol', () => {
    const { symbols } = generatePython(buildFixture())
    const attribute = symbols.find((symbol) => symbol.kind === 'attribute')!

    expect(symbolAtLine(symbols, 'Heroe.py', attribute.lineFrom)?.kind).toBe('attribute')
    expect(symbolAtLine(symbols, 'Heroe.py', 999)).toBeNull()
    expect(symbolAtLine(symbols, 'Nope.py', 1)).toBeNull()
  })
})
