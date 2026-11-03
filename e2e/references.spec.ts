import { expect, test } from './fixtures'

import { codeContent, openSidebar } from './helpers'

test('two objects share the state of the object they call through a reference', async ({
  page,
}) => {
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
  await dialog.getByLabel('Clase destino').selectOption('Bateria')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('usar')
  await dialog.getByRole('button', { name: 'Llamar a una parte' }).first().click()
  await dialog.getByRole('combobox', { name: 'Destino', exact: true }).selectOption('bateria')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Bateria' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Radio' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Radio' }).click()

  await page.getByRole('button', { name: 'radio1', exact: true }).click()
  await page.getByRole('combobox', { name: 'bateria', exact: true }).selectOption('bateria1')
  await page.getByRole('button', { name: 'radio2', exact: true }).click()
  await page.getByRole('combobox', { name: 'bateria', exact: true }).selectOption('bateria1')

  await page.getByRole('button', { name: 'radio1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('usar')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await openSidebar(page, 'Proyecto')
  await page.getByRole('button', { name: 'principal.py' }).click()
  await expect(codeContent(page)).toContainText('radio1.bateria = bateria1')
  await expect(codeContent(page)).toContainText('radio2.bateria = bateria1')
  await page.getByRole('button', { name: 'Radio.py' }).click()
  await expect(codeContent(page)).toContainText('self.bateria.cargar()')

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()
  await expect(page.locator('[data-state-panel]')).toContainText('bateria1.carga')
})

test('a class can reference and call another instance of itself', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Nodo')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('valor')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  const attributeNames = page.getByLabel('Nombre del atributo')
  await attributeNames.nth(1).fill('siguiente')
  await page.getByLabel('Tipo del atributo').nth(1).selectOption('reference')
  await dialog.getByLabel('Clase destino').selectOption('Nodo')

  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('sumar')
  await dialog.getByRole('button', { name: 'Cambiar', exact: true }).click()

  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').nth(1).fill('avanzar')
  await dialog.getByRole('button', { name: 'Llamar a una parte' }).nth(1).click()
  await dialog.getByRole('combobox', { name: 'Destino', exact: true }).selectOption('siguiente')
  await dialog.getByRole('combobox', { name: 'Método', exact: true }).selectOption('sumar')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Nodo' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Nodo' }).click()

  await page.getByRole('button', { name: 'nodo1', exact: true }).click()
  await page.getByRole('combobox', { name: 'siguiente', exact: true }).selectOption('nodo2')
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('avanzar')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await openSidebar(page, 'Proyecto')
  await page.getByRole('button', { name: 'Nodo.py' }).click()
  await expect(codeContent(page)).toContainText('self.siguiente.sumar()')

  await page.getByRole('button', { name: 'Ejecutar' }).click()
  await expect(page.getByText('Listo.')).toBeVisible()
  await expect(page.locator('[data-state-panel]')).toContainText('nodo2.valor')
})
