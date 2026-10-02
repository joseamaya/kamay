import { describe, expect, it } from 'vitest'

import { projectSchema } from '../model'
import type { Project } from '../model'
import { generatePython } from './generatePython'

function buildFixture(): Project {
  return projectSchema.parse({
    version: 1,
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
            inherits: 'Actor',
            attributes: [{ name: 'vida', type: 'number', initial: 100 }],
            methods: [{ name: 'saltar', parameters: [], body: { kind: 'blocks', ops: [] } }],
          },
        ],
        objects: [{ id: 'h1', name: 'h1', class: 'Heroe', attributes: { x: 0, y: 0 } }],
        events: [
          {
            type: 'on_start',
            actions: [{ target: 'h1', method: 'decir', args: { mensaje: '¡Hola!' } }],
          },
        ],
      },
    ],
  })
}

describe('generatePython', () => {
  it('generates one file per class plus principal.py', () => {
    const { files } = generatePython(buildFixture())
    expect(files.map((file) => file.path)).toEqual(['Heroe.py', 'principal.py'])
  })

  it('generates the expected Heroe.py (golden)', () => {
    const { files } = generatePython(buildFixture())
    const heroe = files.find((file) => file.path === 'Heroe.py')

    expect(heroe?.content).toBe(`# -*- coding: utf-8 -*-
# Clase Heroe

from kamay_runtime import Actor

class Heroe(Actor):
    def __init__(self, name=None):
        super().__init__(name)
        self.vida = 100

    def saltar(self):
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
    h1.x = 0
    h1.y = 0
    h1.decir("¡Hola!")


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
          events: [
            {
              type: 'on_start',
              actions: [{ target: 'h1', method: 'mover', args: { y: 2, x: 1 } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('h1.mover(1, 2)')
  })

  it('orders builtin method arguments by the engine parameter order', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [{ id: 'class-heroe', name: 'Heroe', inherits: 'Actor' }],
          objects: [{ id: 'h1', name: 'h1', class: 'Heroe' }],
          events: [
            {
              type: 'on_start',
              actions: [{ target: 'h1', method: 'mover', args: { y: 2, x: 1 } }],
            },
          ],
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
              inherits: 'Actor',
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
          events: [
            {
              type: 'on_start',
              actions: [{ target: 'heroe1', method: 'saludar', args: { mensaje: 'hola' } }],
            },
          ],
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
              inherits: 'Actor',
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

  it('generates a click handler and registers it', () => {
    const project = projectSchema.parse({
      version: 2,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [{ id: 'class-heroe', name: 'Heroe', inherits: 'Actor' }],
          objects: [{ id: 'o1', name: 'heroe1', class: 'Heroe' }],
          events: [
            {
              type: 'on_click',
              source: 'heroe1',
              actions: [{ target: 'heroe1', method: 'decir', args: { mensaje: 'hola' } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')!
    expect(main.content).toContain('from kamay_runtime import registrar')
    expect(main.content).toContain('def al_hacer_clic_heroe1():')
    expect(main.content).toContain('heroe1.decir("hola")')
    expect(main.content).toContain('registrar("click", "heroe1", al_hacer_clic_heroe1)')
  })

  it('generates a collision handler with a sorted pair key', () => {
    const project = projectSchema.parse({
      version: 3,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          classes: [{ id: 'class-circle', name: 'Circle', inherits: 'Actor' }],
          objects: [
            { id: 'o1', name: 'circle1', class: 'Circle' },
            { id: 'o2', name: 'circle2', class: 'Circle' },
          ],
          events: [
            {
              type: 'on_collision',
              source: 'circle2',
              other: 'circle1',
              actions: [{ target: 'circle1', method: 'decir', args: { mensaje: 'choque' } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')!
    expect(main.content).toContain('def al_colisionar_circle1_circle2():')
    expect(main.content).toContain(
      'registrar("collision", "circle1|circle2", al_colisionar_circle1_circle2)',
    )
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
            { id: 'class-personaje', name: 'Personaje', inherits: 'Actor' },
            { id: 'class-heroe', name: 'Heroe', inherits: 'Personaje' },
          ],
        },
      ],
    })

    const files = generatePython(project).files
    const personaje = files.find((file) => file.path === 'Personaje.py')
    const heroe = files.find((file) => file.path === 'Heroe.py')

    expect(personaje?.content).toContain('class Personaje(Actor):')
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
              inherits: 'Actor',
              attributes: [{ name: 'vida', type: 'number', initial: 100 }],
              methods: [
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
                        args: { method: 'decir', values: { mensaje: 'hola' } },
                      },
                      {
                        id: 'b3',
                        op: 'repeat',
                        args: { times: 2 },
                        children: [
                          {
                            id: 'b4',
                            op: 'call',
                            args: { method: 'mover', values: { x: 1, y: 2 } },
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
    expect(heroe?.content).toContain('        self.decir("hola")')
    expect(heroe?.content).toContain('        for _ in range(2):')
    expect(heroe?.content).toContain('            self.mover(1, 2)')
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
              inherits: 'Actor',
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

  it('generates a wait call from an action', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          objects: [{ id: 'h1', name: 'h1', class: 'Heroe' }],
          events: [
            {
              type: 'on_start',
              actions: [{ target: 'h1', method: 'esperar', args: { segundos: 1 } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('h1.esperar(1)')
  })

  it('groups keyboard handlers by key', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          objects: [{ id: 'h1', name: 'h1', class: 'Heroe' }],
          events: [
            {
              type: 'on_key',
              source: 'h1',
              key: 'ArrowUp',
              actions: [{ target: 'h1', method: 'decir', args: { mensaje: 'arriba' } }],
            },
            {
              type: 'on_key',
              source: 'h2',
              key: 'ArrowUp',
              actions: [{ target: 'h1', method: 'decir', args: { mensaje: 'otro' } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('registrar("key", "ArrowUp", al_pulsar_ArrowUp)')
    expect((main?.content.match(/def al_pulsar_ArrowUp\(/g) ?? []).length).toBe(1)
    expect(main?.content).toContain('h1.decir("arriba")')
    expect(main?.content).toContain('h1.decir("otro")')
  })

  it('generates signal handlers and emitir calls', () => {
    const project = projectSchema.parse({
      version: 1,
      meta: { name: 'Demo' },
      scenes: [
        {
          id: 'scene-1',
          name: 'Principal',
          objects: [{ id: 'h1', name: 'h1', class: 'Heroe' }],
          events: [
            {
              type: 'on_signal',
              source: 'h1',
              signal: 'boom',
              actions: [{ target: 'h1', method: 'decir', args: { mensaje: 'boom' } }],
            },
            {
              type: 'on_start',
              actions: [{ target: 'h1', method: 'emitir', args: { nombre: 'boom' } }],
            },
          ],
        },
      ],
    })

    const main = generatePython(project).files.find((file) => file.path === 'principal.py')
    expect(main?.content).toContain('registrar("signal", "boom", al_recibir_boom)')
    expect(main?.content).toContain('h1.emitir("boom")')
  })

  it('is deterministic for the same model', () => {
    const first = generatePython(buildFixture())
    const second = generatePython(buildFixture())
    expect(first).toEqual(second)
  })
})
