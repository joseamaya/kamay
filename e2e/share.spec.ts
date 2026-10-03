import { expect, test } from '@playwright/test'

test('shares a project through a link that opens a copy', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Círculo al escenario' }).click()
  await expect(page.getByRole('button', { name: 'circle1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Compartir' }).click()
  const link = await page.getByLabel('Enlace').inputValue()
  expect(link).toContain('#p=')

  const shared = await context.newPage()
  await shared.goto(link)

  await expect(shared.getByRole('button', { name: 'circle1', exact: true })).toBeVisible()
  await expect(shared.getByText('Proyecto compartido abierto.')).toBeVisible()
})
