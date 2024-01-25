import { createI18n } from 'vue-i18n'

import en from './locales/en.json'
import de from './locales/de.json'

const FALLBACK_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'de']

const browserLanguage = navigator.language?.substring(0, 2).toLowerCase() ?? FALLBACK_LOCALE
const locale = SUPPORTED_LOCALES.includes(browserLanguage) ? browserLanguage : FALLBACK_LOCALE

export default createI18n({
  locale,
  fallbackLocale: FALLBACK_LOCALE,
  legacy: true,
  globalInjection: true,
  messages: { en, de },
})
