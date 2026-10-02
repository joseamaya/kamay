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

class Heroe(Actor):
    def __init__(self):
        super().__init__()
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
    h1 = Heroe()
    h1.x = 0
    h1.y = 0
    h1.decir("¡Hola!")


if __name__ == "__main__":
    main()
`)
  })

  it('is deterministic for the same model', () => {
    const first = generatePython(buildFixture())
    const second = generatePython(buildFixture())
    expect(first).toEqual(second)
  })
})
