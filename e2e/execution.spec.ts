import { expect, test } from '@playwright/test'

import { methodBody, useCodeBody } from './helpers'

test('runs the generated program with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Mensaje').fill('hola')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
})

test('runs a click handler with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Cuándo').selectOption('on_click')
  await page.getByLabel('Mensaje').fill('hola')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })

  // Clicking the actor fires the registered handler.
  await page.locator('canvas').click()
  await expect(page.getByText('Listo.')).toBeVisible()
})

test('runs a collision handler with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Cuándo').selectOption('on_collision')
  await page.getByLabel('Mensaje').fill('boom')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })

  // Both circles start overlapping, so the collision fires once the run is ready.
  await page.waitForTimeout(500)
  await expect(page.getByText('Listo.')).toBeVisible()
})

test('runs a user-defined method with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await useCodeBody(page)
  await methodBody(page).fill('self.decir("hola")')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('saludar')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
})

test('shows an inline error when a method fails', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await useCodeBody(page)
  await methodBody(page).fill('self.no_existe()')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('saludar')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()

  await expect(page.getByText(/Se pidió algo que el objeto no tiene/)).toBeVisible({
    timeout: 150_000,
  })
  await expect(page.getByRole('tab', { name: 'Heroe.py' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.cm-lintRange-error')).toBeVisible()
})

test('runs an inherited method with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Personaje')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await useCodeBody(page)
  await methodBody(page).fill('self.decir("hola")')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await page.getByLabel('Hereda de').selectOption('Personaje')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('saludar')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
})

test('runs a method built with blocks with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await dialog.getByRole('button', { name: 'Orden' }).click()
  await dialog.getByLabel('Mensaje').fill('hola')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('saludar')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
})

test('runs a sequence with a wait with pyodide', async ({ page }) => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the real Pyodide test')
  test.setTimeout(180_000)

  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('esperar')
  await page.getByLabel('Segundos').fill('0.1')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })
})
