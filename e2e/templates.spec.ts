import { expect, test } from './fixtures'

import { codeContent, openMore } from './helpers'

test('loads a template and shows its generated code', async ({ page }) => {
  await page.goto('/')

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Plantillas' }).click()
  await page.getByRole('button', { name: /Mi clase/ }).click()

  await expect(page.getByRole('button', { name: 'Editar Heroe' })).toBeVisible()
  await expect(codeContent(page)).toContainText('heroe1 = Heroe("heroe1")')
})

test('loads the polymorphism template with overridden methods', async ({ page }) => {
  await page.goto('/')

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Plantillas' }).click()
  await page.getByRole('button', { name: /Polimorfismo/ }).click()

  await expect(page.getByRole('button', { name: 'Editar Animal' })).toBeVisible()
  await page.getByRole('button', { name: 'Perro.py' }).click()
  await expect(codeContent(page)).toContainText('class Perro(Animal):')
  await expect(codeContent(page)).toContainText('def hablar(self):')
})
