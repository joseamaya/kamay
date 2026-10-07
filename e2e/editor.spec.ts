import { expect, test } from './fixtures'

import { codeContent, methodBody, openMore, convertToCode } from './helpers'

test('renders the code dock with a syntax-highlighted editor', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.cm-editor')).toBeVisible()
  await expect(page.locator('.cm-gutters .cm-lineNumbers')).toBeVisible()
  await expect(codeContent(page)).toContainText('def main():')
})

test('adds an object and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()

  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toBeVisible()
  await expect(codeContent(page)).toContainText('carro1 = Carro("carro1")')
  await expect(codeContent(page)).toContainText('from Carro import Carro')
})

test('groups the catalog into real-world groups', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Vehículos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Animales' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cosas' })).toBeVisible()
})

test('adds a real-world entity that inherits its domain base', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Carro.py' }).click()
  await expect(codeContent(page)).toContainText('from Vehiculo import Vehiculo')
  await expect(codeContent(page)).toContainText('class Carro(Vehiculo):')
  await expect(codeContent(page)).toContainText('def tocar_bocina(self):')
})

test('adds an attribute change block', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await page.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('vida')
  await page.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()

  await expect(page.getByLabel('Operación')).toHaveValue('+')
  await expect(page.getByLabel('Cantidad')).toHaveValue('1')
})

test('shows the catalog visual variants in the class editor', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'Editar Vehiculo' }).click()

  await expect(page.getByText('Apariencia')).toBeVisible()
  await expect(page.getByLabel('Nombre de la variante')).toHaveValue('Prendido')
})

test('adds a glyph object without leaking its appearance into the code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Perro al escenario' }).click()

  await expect(page.getByRole('button', { name: 'perro1', exact: true })).toBeVisible()
  await expect(codeContent(page)).toContainText('perro1 = Perro("perro1")')
  await expect(codeContent(page)).not.toContainText('glyph')
})

test('creates a class with a method and instantiates it', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await convertToCode(page)
  await methodBody(page).fill('self.decir("hola")')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Heroe.py' }).click()
  await expect(codeContent(page)).toContainText('class Heroe:')
  await expect(codeContent(page)).toContainText('def saludar(self):')
  await expect(codeContent(page)).toContainText('self.decir("hola")')

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'principal.py' }).click()
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

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()

  await page.getByRole('button', { name: 'Carro.py' }).click()
  await expect(codeContent(page)).toContainText('class Carro(Vehiculo):')

  await page.getByRole('button', { name: 'principal.py' }).click()
  await expect(codeContent(page)).toContainText('carro1 = Carro("carro1")')
})

test('adds an action and reflects it in the code view', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('tocar_bocina')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await expect(codeContent(page)).toContainText('carro1.tocar_bocina()')
})

test('warns before discarding unsaved changes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await openMore(page)
  await page.getByRole('menuitem', { name: 'Nuevo' }).click()

  await expect(page.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toHaveCount(0)
})

test('saves and reopens a project from local storage', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Bicicleta al escenario' }).click()
  await expect(page.getByRole('button', { name: 'bicicleta1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Proyecto guardado.')).toBeVisible()
  await openMore(page)
  await page.getByRole('menuitem', { name: 'Nuevo' }).click()
  await expect(page.getByRole('button', { name: 'bicicleta1', exact: true })).toHaveCount(0)

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Portafolio' }).click()
  await page
    .getByRole('dialog', { name: 'Portafolio' })
    .getByRole('button', { name: /^Proyecto sin título/ })
    .click()
  await expect(page.getByRole('button', { name: 'bicicleta1', exact: true })).toBeVisible()
})

test('creates a class that inherits from another class', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Personaje')
  await dialog.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('vida')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByLabel('Hereda de').selectOption('Personaje')
  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Heroe.py' }).click()
  await expect(codeContent(page)).toContainText('from Personaje import Personaje')
  await expect(codeContent(page)).toContainText('class Heroe(Personaje):')

  await page.getByRole('button', { name: 'Personaje.py' }).click()
  await expect(codeContent(page)).toContainText('class Personaje:')

  await page.getByRole('button', { name: 'Crear objeto de Heroe' }).click()
  await page.getByRole('button', { name: 'heroe1', exact: true }).click()
  await expect(page.getByLabel('vida', { exact: true })).toBeVisible()

  const overlay = page.locator('[data-selection-overlay]')
  await expect(overlay).toContainText('Instancia de Heroe')
  await expect(overlay).toContainText('Heroe → Personaje')
})

test('creates and switches between scenes', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Nueva escena' }).click()
  await expect(page.getByRole('button', { name: 'Escena 2', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Agregar Bicicleta al escenario' }).click()
  await expect(page.getByRole('button', { name: 'bicicleta1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Principal', exact: true }).click()
  await expect(page.getByRole('button', { name: 'carro1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'bicicleta1', exact: true })).toHaveCount(0)
})

test('renames and deletes a scene', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva escena' }).click()
  await page.getByRole('button', { name: 'Renombrar Escena 2' }).click()
  await page.getByLabel('Nombre de la escena').fill('Nivel 2')
  await page.getByRole('dialog').getByRole('button', { name: 'Entendido' }).click()
  await expect(page.getByRole('button', { name: 'Nivel 2', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar Nivel 2' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('button', { name: 'Nivel 2', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Principal', exact: true })).toBeVisible()
})

test('builds a method body with blocks', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')

  await dialog.getByRole('button', { name: 'Llamada' }).click()

  await dialog.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Heroe.py' }).click()
  await expect(codeContent(page)).toContainText('def saludar(self):')
  await expect(codeContent(page)).toContainText('self.saludar()')
})

test('converts code into blocks and keeps advanced code', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  const dialog = page.getByRole('dialog')
  await page.getByLabel('Nombre de la clase').fill('Heroe')
  await dialog.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('saludar')
  await convertToCode(page)
  await methodBody(page).fill('self.decir("hola")\nif True:\n    self.decir("x")')
  await dialog.getByRole('button', { name: 'Convertir a bloques' }).click()

  await expect(dialog.getByText('Código avanzado')).toBeVisible()
})

test('adds orders that run in order', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  await page.getByRole('button', { name: 'carro1', exact: true }).click()
  await page.getByRole('button', { name: 'Llamar método' }).click()
  await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('moverse')
  await page.getByRole('button', { name: 'Llamar método' }).click()

  await expect(codeContent(page)).toContainText('carro1.tocar_bocina()')
  await expect(codeContent(page)).toContainText('carro1.moverse()')
})

test('toggles physics for a scene', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Física' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()

  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Gravedad')).toBeVisible()
})
