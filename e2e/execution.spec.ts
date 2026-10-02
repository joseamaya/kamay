import { expect, test } from '@playwright/test'

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
