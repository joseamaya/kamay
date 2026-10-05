import { expect, test } from '@playwright/test'

test('detects the shared-state misconception when editing an instance', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({ completed: [], freeMode: false, unlockedLevel: 3, onboardingDone: true }),
    )
  })

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const editor = page.getByRole('dialog', { name: 'Nueva clase' })
  await page.getByLabel('Nombre de la clase').fill('Perro')
  await editor.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('energia')
  await page.getByLabel('Valor').fill('50')
  await editor.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Perro' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Perro' }).click()

  await page.getByRole('button', { name: 'perro1', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'energia' }).fill('20')

  const dialog = page.getByRole('dialog', { name: 'Predicción' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'También cambiará a 20' }).click()
  await expect(dialog.getByText(/cada instancia guarda su propio estado/i)).toBeVisible()
})
