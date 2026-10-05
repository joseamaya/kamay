import { expect, test } from './fixtures'

import { openMore } from './helpers'

test('imports deliveries and shows an aggregate report', async ({ page }) => {
  await page.goto('/')

  await openMore(page)
  await page.getByRole('menuitem', { name: 'Modo docente' }).click()

  const dialog = page.getByRole('dialog', { name: 'Modo docente' })
  await expect(dialog.getByText('Todavía no hay entregas importadas.')).toBeVisible()

  const delivery = {
    app: 'kamay',
    kind: 'entrega',
    exportedAt: '2026-01-01T00:00:00Z',
    project: { version: 6, meta: { name: 'Demo' }, scenes: [{ id: 's', name: 'Principal' }] },
    python: {},
    missions: { completed: ['first_object'], total: 16 },
    rubric: [{ id: 'objects', status: 'practiced', count: 1 }],
    evidence: {
      version: 1,
      misconceptions: ['shared_state'],
      predictions: { state: { correct: 1, misconception: 0, explained: 0 } },
      missionDates: {},
    },
  }

  await dialog.locator('input[type=file]').setInputFiles({
    name: 'entrega.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(delivery)),
  })

  await expect(dialog.getByText('Entregas importadas: 1')).toBeVisible()
  await expect(dialog.getByText('Demo', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Estado compartido')).toBeVisible()
})
