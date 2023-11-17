// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'onsenui/css/onsenui.css'
import 'onsenui/css/onsen-css-components.css'

import Vue from 'vue'
import VueOnsen from 'vue-onsenui'
import VueChatScroll from 'vue-chat-scroll'
import VueResource from 'vue-resource'
import store from './store'
import App from './App'

Vue.config.productionTip = false

Vue.use(VueOnsen)
Vue.use(VueChatScroll)
Vue.use(VueResource)

const twentyFourHoursInMs = 24 * 60 * 60 * 1000

Vue.mixin({
  data () {
    return {
      AUTH_PREAMBLE: 'VERNAM'
    }
  },
  methods: {
    humanDate (timestamp) {
      const date = new Date(timestamp)
      const timeText = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' }).format(date)
      const now = new Date()
      const todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
      let isToday = false
      let dateText

      if (timestamp >= todayAtMidnightTimestamp) {
        isToday = true
        dateText = 'Today'
      } else if (timestamp >= todayAtMidnightTimestamp - twentyFourHoursInMs) {
        dateText = 'Yesterday'
      } else if (timestamp >= todayAtMidnightTimestamp - (6 * twentyFourHoursInMs)) {
        dateText = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date)
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

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App }
})
