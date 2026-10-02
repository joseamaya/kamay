import { expect, test } from '@playwright/test'

import { codeContent, methodBody } from './helpers'

test('renders the code dock with a syntax-highlighted editor', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.cm-editor')).toBeVisible()
  await expect(page.locator('.cm-gutters .cm-lineNumbers')).toBeVisible()
  await expect(codeContent(page)).toContainText('def main():')
})

test('adds an object and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toBeVisible()
  await expect(codeContent(page)).toContainText('circle1 = Circle("circle1")')
  await expect(codeContent(page)).toContainText('from Circle import Circle')
})

test('creates a class with a method and instantiates it', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await methodBody(page).fill('self.decir("hola")')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('tab', { name: 'Heroe.py' }).click()
  await expect(codeContent(page)).toContainText('class Heroe(Actor):')
  await expect(codeContent(page)).toContainText('def saludar(self):')
  await expect(codeContent(page)).toContainText('self.decir("hola")')

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('tab', { name: 'principal.py' }).click()
  await expect(codeContent(page)).toContainText('heroe1 = Heroe("heroe1")')
})

test('keeps per-instance state for objects of the same class', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('vida')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()

  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await page.getByLabel('vida', { exact: true }).fill('40')

  await expect(codeContent(page)).toContainText('heroe1.vida = 40')
  await expect(codeContent(page)).toContainText('heroe2.vida = 0')
})

test('shows every generated file and switches tabs', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()

  await page.getByRole('tab', { name: 'Circle.py' }).click()
  await expect(codeContent(page)).toContainText('class Circle(Actor):')

  await page.getByRole('tab', { name: 'principal.py' }).click()
  await expect(codeContent(page)).toContainText('circle1 = Circle("circle1")')
})

test('adds an action and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'circle1', exact: true }).click()
  await page.getByLabel('Mensaje').fill('hola')
  await page.getByRole('button', { name: 'Agregar orden' }).click()

  await expect(codeContent(page)).toContainText('circle1.decir("hola")')
})

test('warns before discarding unsaved changes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await page.getByRole('button', { name: 'Nuevo' }).click()

  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toHaveCount(0)
})

test('saves and reopens a project from local storage', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Cuadrado al escenario' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Proyecto guardado.')).toBeVisible()
  await page.getByRole('button', { name: 'Nuevo' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Abrir' }).click()
  await page.getByRole('button', { name: 'Proyecto sin título' }).click()
  await expect(page.getByRole('button', { name: 'square1', exact: true })).toBeVisible()
})

test('creates a class that inherits from another class', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Personaje')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await page.getByLabel('Hereda de').selectOption('Personaje')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('tab', { name: 'Heroe.py' }).click()
  await expect(codeContent(page)).toContainText('from Personaje import Personaje')
  await expect(codeContent(page)).toContainText('class Heroe(Personaje):')

  await page.getByRole('tab', { name: 'Personaje.py' }).click()
  await expect(codeContent(page)).toContainText('class Personaje(Actor):')
})
