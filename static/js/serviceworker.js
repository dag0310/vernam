const FALLBACK_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'de']

const browserLanguage = (navigator.language != null) ? navigator.language.substring(0, 2).toLowerCase() : FALLBACK_LOCALE
const locale = SUPPORTED_LOCALES.includes(browserLanguage) ? browserLanguage : FALLBACK_LOCALE

const translations = {
  de: {
    newMessageTitle: 'Neue Nachricht eines Vernam-Kontakts',
  },
  en: {
    newMessageTitle: 'New message from a Vernam contact',
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification(translations[locale].newMessageTitle, {
      icon: '/static/img/favicon-256x256-rounded.png',
    })
  )
})
