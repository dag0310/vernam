/* eslint-disable no-undef */
const FALLBACK_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'de']

const browserLanguage = (navigator.language != null) ? navigator.language.substring(0, 2).toLowerCase() : FALLBACK_LOCALE
const locale = SUPPORTED_LOCALES.includes(browserLanguage) ? browserLanguage : FALLBACK_LOCALE

const translations = {
  de: {
    newMessageTitle: 'Neue Vernam-Nachricht',
  },
  en: {
    newMessageTitle: 'New Vernam message',
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focused' in client && client.focused) {
          return
        }
      }
      self.registration.showNotification(translations[locale].newMessageTitle, {
        icon: '/static/img/favicon-256x256-rounded.png',
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      if ('openWindow' in clients) {
        return clients.openWindow('/')
      }
    })
  )
})
