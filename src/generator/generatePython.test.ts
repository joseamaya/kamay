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

  it('is deterministic for the same model', () => {
    const first = generatePython(buildFixture())
    const second = generatePython(buildFixture())
    expect(first).toEqual(second)
  })
})
