import { expect, test } from './fixtures'

test('opens a contextual menu anchored to the selected object', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()

  const overlay = page.locator('[data-selection-overlay]')
  await expect(overlay).toBeVisible()
  await expect(overlay).toContainText('circle1')
  await expect(overlay).toContainText('Instancia de Circle')
  await expect(overlay.getByText('Aspecto')).toBeVisible()
  await expect(overlay.getByLabel('Cuándo')).toBeVisible()

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

test('duplicates and deletes the selected object from the menu', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()

  const overlay = page.locator('[data-selection-overlay]')
  await overlay.getByRole('button', { name: 'Duplicar' }).click()
  await expect(page.getByRole('button', { name: 'circle2', exact: true })).toBeVisible()

  await overlay.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toHaveCount(0)
})
