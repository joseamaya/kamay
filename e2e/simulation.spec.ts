import { expect, test } from './fixtures'

test('simulates a block-only project without Pyodide', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByLabel('Orden').selectOption('prender')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // The inherited `prender` method ran and flipped `encendido` to true, which
  // activates the `Vehiculo` "Prendido" visual variant.
  await expect(page.locator('[data-state-panel]')).toContainText('carro1.encendido')
})

test('drives movement and speech from state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Orden' }).selectOption('moverse')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('combobox', { name: 'Orden' }).selectOption('tocar_bocina')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // `moverse` adds to `x` and `tocar_bocina` sets `mensaje`; the engine turns
  // those state changes into movement and a speech bubble.
  const panel = page.locator('[data-state-panel]')
  await expect(panel).toContainText('carro1.x')
  await expect(panel).toContainText('carro1.mensaje')
})

test('scrubs the step timeline', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Orden' }).selectOption('moverse')
  await page.getByRole('button', { name: 'Agregar orden' }).click()
  await page.getByRole('combobox', { name: 'Orden' }).selectOption('tocar_bocina')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await page.getByRole('button', { name: 'Paso a paso' }).click()
  await page.getByRole('button', { name: 'Ejecutar' }).click()

  await expect(page.getByText('Paso 1 de 3')).toBeVisible()

  // Jump forward on the timeline instead of stepping one by one.
  const timeline = page.getByRole('slider', { name: 'Línea de tiempo' })
  await timeline.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByText('Paso 2 de 3')).toBeVisible()

  // And jump straight to the end.
  await timeline.focus()
  await page.keyboard.press('End')
  await expect(page.getByText('Paso 3 de 3')).toBeVisible()
})

test('runs a for-each action over a class and its subclasses', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Perro al escenario' }).click()
  await page.getByRole('button', { name: 'Agregar Gato al escenario' }).click()
  await page.getByRole('button', { name: 'perro1', exact: true }).click()

  await page.getByRole('combobox', { name: 'Tipo de acción' }).selectOption('for_each')
  await page.getByRole('combobox', { name: 'Clase' }).selectOption('Animal')
  await page.getByRole('combobox', { name: 'Orden' }).selectOption('comer')
  await page.getByRole('button', { name: 'Agregar «para cada»' }).click()

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()

  // `comer` is inherited by both Perro and Gato, so the loop covers both.
  const panel = page.locator('[data-state-panel]')
  await expect(panel).toContainText('perro1.energia')
  await expect(panel).toContainText('gato1.energia')
})
