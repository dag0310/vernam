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

Vue.mixin({
  data () {
    return {
      AUTH_SECRET: 'VERNAM'
    }
  },
  methods: {
    humanDate (timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
      const dayInMs = 3600000 * 24
      const timeText = ('' + (date.getHours())).padStart(2, '0') + ':' + ('' + (date.getMinutes())).padStart(2, '0')
      let isToday = false
      let dateText

      if (timestamp >= todayAtMidnightTimestamp) {
        isToday = true
        dateText = 'Today'
      } else if (timestamp >= todayAtMidnightTimestamp - dayInMs) {
        dateText = 'Yesterday'
      } else if (timestamp >= todayAtMidnightTimestamp - dayInMs * 6) {
        dateText = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
      } else {
        dateText = date.getFullYear() + '-' +
          ('' + (date.getMonth() + 1)).padStart(2, '0') + '-' +
          ('' + (date.getDate())).padStart(2, '0')
      }

      return { isToday, dateText, timeText }
    }
  }
})

Vue.http.options.root = 'https://vernam.herokuapp.com'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App }
})
