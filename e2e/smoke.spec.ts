import { expect, test } from '@playwright/test'

import { codeContent } from './helpers'

test('loads the three synchronized views', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Kamay', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Escenario' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fábrica' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Código' })).toBeVisible()
})

test('shows the Python generated from the project', async ({ page }) => {
  await page.goto('/')
  await expect(codeContent(page)).toContainText('def main():')
})
