// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'onsenui/css/onsenui.css'
import 'onsenui/css/onsen-css-components.css'

import Vue from 'vue'
import VueOnsen from 'vue-onsenui'
import VueChatScroll from 'vue-chat-scroll'
import VueResource from 'vue-resource'
import platform from 'platform-detect'
import store from './store'
import App from './App'
import i18n from './i18n'

Vue.config.productionTip = false

Vue.use(VueOnsen)
Vue.use(VueChatScroll)
Vue.use(VueResource)

const twentyFourHoursInMs = 24 * 60 * 60 * 1000
let pollingActive = true
let debugMode = false

Vue.mixin({
  data () {
    return {
      AUTH_PREAMBLE: 'VERNAM'
    }
  },
  methods: {
    setDebugMode (isDebugMode) {
      if (debugMode === isDebugMode) {
        return
      }
      debugMode = isDebugMode
    },
    isDebugMode () {
      return debugMode
    },
    setPollingActive (isActive) {
      if (pollingActive === isActive) {
        return
      }
      pollingActive = isActive
    },
    isPollingActive () {
      return pollingActive
    },
    handleUnexpectedError (error, prefix) {
      console.error(error)
      const code = error.status || 'NO_CODE'
      let message = (prefix != null) ? prefix + ' ' : ''
      message += error.body ? (error.body.message || 'NO_MESSAGE') : 'NO_BODY'
      this.$ons.notification.toast(this.$t('unexpectedError', { code, message }), { timeout: 3000 })
    },
    buildNotificationPermissionNotSupportedMessage () {
      if (platform.ios) {
        return this.$t('notificationPermissionNotSupportedIos') + (platform.pwa ? ' iOS Version 16.4+' : '')
      }
      if (platform.android) {
        return this.$t('notificationPermissionNotSupportedAndroid') + (platform.pwa ? ' Google Chrome Version 50+' : '')
      }
      return this.$t('notificationPermissionNotSupportedOther')
    },
    humanizeDate (timestamp) {
      const date = new Date(timestamp)
      const timeText = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' }).format(date)
      const now = new Date()
      const todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
      let isToday = false
      let dateText

      if (timestamp >= todayAtMidnightTimestamp) {
        isToday = true
        dateText = this.$t('today')
      } else if (timestamp >= todayAtMidnightTimestamp - twentyFourHoursInMs) {
        dateText = this.$t('yesterday')
      } else if (timestamp >= todayAtMidnightTimestamp - (6 * twentyFourHoursInMs)) {
        const formatOptions = { weekday: 'short', month: 'numeric', day: 'numeric' }
        if (date.getFullYear() !== now.getFullYear()) {
          formatOptions.year = 'numeric'
        }
        dateText = new Intl.DateTimeFormat(undefined, formatOptions).format(date)
      } else {
        dateText = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date)
      }

      return { isToday, dateText, timeText }
    },
    buildTotalKeyByteArray (qrCodes) {
      const byteArrays = qrCodes.sort((a, b) => a.number - b.number).map(qrCode => qrCode.bytes)
      const flattenedByteArrays = Uint8Array.from(byteArrays.reduce((a, b) => [...a, ...b], []))
      return flattenedByteArrays
    },
  }
})

Vue.http.options.root = process.env.API_URL || 'http://localhost:3000'

new Vue({
  el: '#app',
  i18n,
  store,
  template: '<App/>',
  components: { App }
})
