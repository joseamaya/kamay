import { expect, test } from './fixtures'

test('opens a contextual menu anchored to the selected object', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const overlay = page.locator('[data-selection-overlay]')
  await expect(overlay).toBeVisible()
  await expect(overlay).toContainText('carro1')
  await expect(overlay).toContainText('Instancia de Carro')
  await expect(overlay.getByText('Aspecto')).toBeVisible()
  await expect(overlay.getByRole('combobox', { name: 'Mensaje', exact: true })).toBeVisible()

  const canvasBox = await page.getByRole('application', { name: /Escenario/ }).boundingBox()
  const overlayBox = await overlay.boundingBox()
  expect(canvasBox).not.toBeNull()
  expect(overlayBox).not.toBeNull()
  if (canvasBox && overlayBox) {
    expect(overlayBox.x).toBeGreaterThanOrEqual(canvasBox.x)
    expect(overlayBox.x + overlayBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width)
    expect(overlayBox.y).toBeGreaterThanOrEqual(canvasBox.y)
    expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(canvasBox.y + canvasBox.height)
  }
})

test('rotates the selected object with the mouse handle', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const rotate = page.getByRole('button', { name: 'Rotar objeto' })
  await expect(rotate).toBeVisible()
  await expect(page.getByRole('button', { name: 'Redimensionar objeto' })).toBeVisible()

  const box = await rotate.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 80, startY + 80, { steps: 8 })
  await page.mouse.up()

  const overlay = page.locator('[data-selection-overlay]')
  await expect(overlay).toHaveAttribute('data-simulation', /"rotation":-?\d*[1-9]/)
})

test('duplicates and deletes the selected object from the menu', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const overlay = page.locator('[data-selection-overlay]')
  await overlay.getByRole('button', { name: 'Duplicar' }).click()
  await expect(page.getByRole('button', { name: 'carro2', exact: true })).toBeVisible()

  await overlay.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toHaveCount(0)
})
