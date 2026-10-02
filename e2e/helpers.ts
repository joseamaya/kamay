import type { Locator, Page } from '@playwright/test'

export function codeContent(page: Page): Locator {
  return page.locator('.cm-content')
}

export function methodBody(page: Page): Locator {
  return page.getByLabel('Cuerpo')
}

export async function useCodeBody(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Convertir a código' }).click()
}
