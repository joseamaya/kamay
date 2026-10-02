import { es } from './es'
import type { Messages } from './es'

export const messages: { es: Messages } = { es }

export const defaultLocale = 'es'
export type Locale = keyof typeof messages

export function getMessages(locale: Locale = defaultLocale): Messages {
  return messages[locale]
}

export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}

export { es }
export type { Messages }
