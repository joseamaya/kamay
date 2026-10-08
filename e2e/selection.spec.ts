import { expect, test } from './fixtures'

test('shows the inspector panel for the selected object', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const inspector = page.locator('[data-inspector]')
  await expect(inspector).toBeVisible()
  await expect(inspector).toContainText('carro1')
  await expect(inspector).toContainText('Instancia de Carro')
  await expect(inspector.getByRole('heading', { name: /Estado/ })).toBeVisible()
  await expect(inspector.getByText('Aspecto')).toHaveCount(0)
  await expect(inspector.getByRole('combobox', { name: 'Método', exact: true })).toBeVisible()
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

  const overlay = page.locator('[data-inspector]')
  await expect(overlay).toHaveAttribute('data-simulation', /"rotation":-?\d*[1-9]/)
})

test('duplicates and deletes the selected object from the inspector', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()

  const overlay = page.locator('[data-inspector]')
  await overlay.getByRole('button', { name: 'Duplicar' }).click()
  await expect(page.getByRole('button', { name: 'carro2', exact: true })).toBeVisible()

  await overlay.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toHaveCount(0)
})
