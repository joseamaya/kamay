import { es } from './es'
import type { Messages } from './es'

export const messages: { es: Messages } = { es }

export const defaultLocale = 'es'
export type Locale = keyof typeof messages

export function getMessages(locale: Locale = defaultLocale): Messages {
  return messages[locale]
}

export { es }
export type { Messages }
