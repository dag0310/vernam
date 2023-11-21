const FALLBACK_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'de']

const browserLanguage = (navigator.language != null) ? navigator.language.substring(0, 2).toLowerCase() : FALLBACK_LOCALE
const locale = SUPPORTED_LOCALES.includes(browserLanguage) ? browserLanguage : FALLBACK_LOCALE

const translations = {
  de: {
    newMessageTitle: 'Neue Nachricht',
    newMessageBody: 'Ein Kontakt hat dir auf Vernam geschrieben.',
  },
  en: {
    newMessageTitle: 'New message',
    newMessageBody: 'One of your contacts texted you on Vernam.',
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification(translations[locale].newMessageTitle, {
      body: translations[locale].newMessageBody,
      icon: '/static/img/favicon-256x256-rounded.png',
    })
  )
})
