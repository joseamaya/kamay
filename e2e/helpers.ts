import type { Locator, Page } from '@playwright/test'

export function codeContent(page: Page): Locator {
  return page.locator('.cm-content')
}

export function methodBody(page: Page): Locator {
  return page.getByLabel('Cuerpo')
}
