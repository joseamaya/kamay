import { expect, test } from '@playwright/test'

import { openMenu } from './helpers'

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
  await dialog.getByRole('button', { name: 'Volver a intentar' }).click()
  await dialog.getByRole('button', { name: 'Seguirá siendo 50' }).click()
  await expect(dialog.getByText(/Cada instancia tiene su propio estado/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Entendido' }).click()

  await openMenu(page, 'Curso')
  await page.getByRole('menuitem', { name: 'Rúbrica' }).click()
  const rubric = page.getByRole('dialog', { name: 'Rúbrica' })
  await expect(rubric.getByText(/Para repasar/)).toBeVisible()
  await expect(rubric.getByText('Estado compartido')).toBeVisible()
})

test('warns when inheritance is only used to reuse', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({ completed: [], freeMode: false, unlockedLevel: 5, onboardingDone: true }),
    )
  })

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let editor = page.getByRole('dialog', { name: 'Nueva clase' })
  await page.getByLabel('Nombre de la clase').fill('Animal')
  await editor.getByRole('button', { name: 'Agregar método' }).click()
  await page.getByLabel('Nombre del método').fill('comer')
  await editor.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  editor = page.getByRole('dialog', { name: 'Nueva clase' })
  await page.getByLabel('Nombre de la clase').fill('Perro')
  await editor.getByLabel('Hereda de').selectOption('Animal')

  await expect(editor.getByText(/La herencia expresa una relación/)).toBeVisible()
})

test('predicts the shared state when two objects reference the same instance', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kamay.progress',
      JSON.stringify({ completed: [], freeMode: false, unlockedLevel: 6, onboardingDone: true }),
    )
  })

  await page.goto('/')

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  let editor = page.getByRole('dialog', { name: 'Nueva clase' })
  await page.getByLabel('Nombre de la clase').fill('Bateria')
  await editor.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('carga')
  await page.getByLabel('Valor').fill('50')
  await editor.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Nueva clase' }).click()
  editor = page.getByRole('dialog', { name: 'Nueva clase' })
  await page.getByLabel('Nombre de la clase').fill('Radio')
  await editor.getByRole('button', { name: 'Agregar atributo' }).click()
  await page.getByLabel('Nombre del atributo').fill('bateria')
  await editor.getByLabel('Tipo del atributo').selectOption('reference')
  await editor.getByRole('button', { name: 'Guardar' }).click()

  await page.getByRole('button', { name: 'Crear objeto de Bateria' }).click()
  await page.getByRole('button', { name: 'Crear objeto de Radio' }).click()

  await page.getByRole('button', { name: 'radio1', exact: true }).click()
  await page.getByRole('combobox', { name: 'bateria', exact: true }).selectOption('bateria1')

  await page.getByRole('button', { name: 'bateria1', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'carga' }).fill('20')

  const dialog = page.getByRole('dialog', { name: 'Predicción' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/radio1\.bateria apunta a bateria1/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Seguirá siendo 50' }).click()
  await expect(dialog.getByText(/comparten el mismo estado/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Volver a intentar' }).click()
  await dialog.getByRole('button', { name: 'También cambiará a 20' }).click()
  await expect(dialog.getByText(/la misma instancia/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Entendido' }).click()
})
