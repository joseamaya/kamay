import { expect, test } from './fixtures'

test('toggles step-by-step mode', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Paso a paso' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
})
