import { expect, test } from '@playwright/test'

test('guides a new browser from level 1 to level 2', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Nivel 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nueva clase' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Editar valores' })).toHaveCount(0)
  await expect(page.getByText('Se desbloquea en el Nivel 3.')).toBeVisible()

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()

  await expect(page.getByRole('button', { name: 'Nivel 2' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar valores' })).toBeVisible()
  await expect(page.getByText('¡Nivel 2 desbloqueado!')).toBeVisible()

  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Orden' })).toBeVisible()
  await expect(page.getByLabel('Cuándo')).toHaveCount(0)
})

test('free mode unlocks everything', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Nueva clase' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Nivel 1' }).click()
  const dialog = page.getByRole('dialog', { name: 'Camino de aprendizaje' })
  await dialog.getByRole('button', { name: 'Modo libre' }).click()
  await dialog.getByRole('button', { name: 'Entendido' }).click()

  await expect(page.getByRole('button', { name: 'Nueva clase' })).toBeVisible()
})
