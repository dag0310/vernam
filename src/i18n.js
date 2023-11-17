import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages () {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

const FALLBACK_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'de']

const browserLanguage = (navigator.language != null) ? navigator.language.substring(0, 2).toLowerCase() : FALLBACK_LOCALE
const locale = SUPPORTED_LOCALES.includes(browserLanguage) ? browserLanguage : FALLBACK_LOCALE

export default new VueI18n({
  locale: locale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: loadLocaleMessages()
})
