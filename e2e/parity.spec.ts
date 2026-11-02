import { expect, test } from './fixtures'

import { convertToCode, methodBody } from './helpers'

/**
 * Real-Python parity for the shared subset described in
 * `src/runtime/parity.test.ts`. It is opt-in because it loads Pyodide:
 * `PYODIDE_E2E=1 pnpm test:e2e`.
 */
test.describe('engine parity', () => {
  test.skip(!process.env.PYODIDE_E2E, 'set PYODIDE_E2E=1 to run the parity suite')

  test('two instances of a class keep independent state in Python', async ({ page }) => {
    test.setTimeout(180_000)

    await page.goto('/')

    await page.getByRole('button', { name: 'Nueva clase' }).click()
    const dialog = page.getByRole('dialog')
    await page.getByLabel('Nombre de la clase').fill('Contador')
    await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
    await page.getByLabel('Nombre del atributo').fill('valor')
    await dialog.getByRole('button', { name: 'Agregar método' }).click()
    await page.getByLabel('Nombre del método').fill('sumar')
    await convertToCode(page)
    await methodBody(page).fill('self.valor = self.valor + 1')
    await dialog.getByRole('button', { name: 'Guardar' }).click()

    await page.getByRole('button', { name: 'Crear objeto de Contador' }).click()
    await page.getByRole('button', { name: 'Crear objeto de Contador' }).click()
    await page.getByRole('button', { name: 'contador1', exact: true }).click()
    await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('sumar')
    await page.getByRole('button', { name: 'Llamar método' }).click()

    await page.getByRole('button', { name: 'Ejecutar' }).click()
    await expect(page.getByText('Listo.')).toBeVisible({ timeout: 150_000 })

    // Only `contador1` changes: each instance owns its own state.
    const panel = page.locator('[data-state-panel]')
    await expect(panel).toContainText('contador1.valor')
    await expect(panel).not.toContainText('contador2.valor')
  })
})
