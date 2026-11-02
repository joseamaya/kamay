import { expect, test } from './fixtures'

import { codeContent, openSidebar } from './helpers'

test('two objects share the state of the object they reference', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Bateria')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('carga')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('cargar')
  await dialog.getByRole('button', { name: 'Cambiar', exact: true }).click()
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Radio')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('bateria')
  await page.getByLabel('Tipo del atributo').selectOption('reference')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Bateria' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Radio' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Radio' }).click()

  await page.getByRole('button', { name: 'radio1', exact: true }).click()
  await page.getByRole('combobox', { name: 'bateria', exact: true }).selectOption('bateria1')
  await page.getByRole('button', { name: 'radio2', exact: true }).click()
  await page.getByRole('combobox', { name: 'bateria', exact: true }).selectOption('bateria1')

  await page.getByRole('button', { name: 'bateria1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('cargar')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await openSidebar(page, 'Proyecto')
  await page.getByRole('button', { name: 'principal.py' }).click()
  await expect(codeContent(page)).toContainText('radio1.bateria = bateria1')
  await expect(codeContent(page)).toContainText('radio2.bateria = bateria1')

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()
  await expect(page.locator('[data-state-panel]')).toContainText('bateria1.carga')
})
