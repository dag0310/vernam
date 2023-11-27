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
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focused' in client && client.focused) {
          return
        }
      }
      self.registration.showNotification(translations[locale].newMessageTitle, {
        icon: '/static/img/favicon-256x256-rounded.png',
        data: { url: self.location.origin },
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      const client = clients.find(c => c.url.includes(self.location.origin))
      if (client != null) {
        return client.focus()
      }
      return self.clients.openWindow(self.location.origin)
    })
  )
})
