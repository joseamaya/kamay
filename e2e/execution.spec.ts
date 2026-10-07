import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

import { methodBody, openMore, convertToCode } from './helpers'

async function addHeroeWithRawMethod(page: Page, code: string) {
  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('vida')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('curar')
  await convertToCode(page)
  await methodBody(page).fill(code)
  await dialog.getByRole('button', { name: 'Guardar' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
}

test('simulates a block-only project without pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the execution suite')

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('prender')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()
  await expect(page.locator('[data-state-panel]')).toContainText('carro1.encendido')
})

test('runs a raw-code method with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')
  await addHeroeWithRawMethod(page, 'self.vida = self.vida + 10')
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('curar')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
  await expect(page.locator('[data-state-panel]')).toContainText('heroe1.vida')
})

test('shows an inline error when a method fails', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')
  await addHeroeWithRawMethod(page, 'self.no_existe()')
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('curar')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()

  await expect(page.getByText(/Se pidió algo que el objeto no tiene/)).toBeVisible({
    timeout: 150_000,
  })
  await expect(page.getByText(/le falta el método o atributo «no_existe»/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Heroe.py' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('.cm-lintRange-error')).toBeVisible()
})

test('runs step by step', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the execution suite')

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('prender')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await page.getByRole('button', { name: 'Paso a paso' }).click()
  await page.getByRole('button', { name: 'Ejecutar' }).click()

  await expect(page.getByText(/Paso 1 de \d+/)).toBeVisible()
  await page.getByRole('button', { name: 'Paso', exact: true }).click()
  await expect(page.getByText(/Paso 2 de \d+/)).toBeVisible()
  await page.getByRole('button', { name: 'Atrás' }).click()
  await expect(page.getByText(/Paso 1 de \d+/)).toBeVisible()
})

test('runs the polymorphism template', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the execution suite')

  await page.goto('/')

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Plantillas' }).click()
  await page.getByRole('button', { name: /Polimorfismo/ }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()
})
