import { expect, test } from './fixtures'

test('scrolls long generated code inside the code dock', async ({ page }) => {
  await page.goto('/')

  for (let index = 0; index < 12; index += 1) {
    await page.getByRole('button', { name: 'Agregar Carro al escenario' }).click()
  }

  const scroller = page.locator('.cm-scroller')
  await expect(scroller).toBeVisible()

  const overflows = await scroller.evaluate(
    (element) => element.scrollHeight > element.clientHeight,
  )
  expect(overflows).toBe(true)

  await scroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const atBottom = await scroller.evaluate(
    (element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
  )
  expect(atBottom).toBe(true)
})
