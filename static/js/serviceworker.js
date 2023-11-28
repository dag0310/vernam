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
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      if (clients.some(client => client.focused || client.visibilityState === 'visible')) {
        return
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
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      (clients.length > 0) ? clients[0].focus() : self.clients.openWindow(self.location.origin).then(client => client.focus())
    })
  )
})
