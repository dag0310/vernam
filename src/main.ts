import { IonicVue } from '@ionic/vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import axios from 'axios'
import VueAxios from 'vue-axios'

import router from './router'
import i18n from './i18n'
import App from './App.vue'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
// import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
// import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
// import '@ionic/vue/css/display.css'

import '@ionic/vue/css/palettes/dark.system.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const API_URL_KEY = 'VITE_API_URL'
const FALLBACK_API_URL = 'http://localhost:3000'
if (import.meta.env[API_URL_KEY] == null) {
  console.info(`You can specify your own ${API_URL_KEY} in the environment file. Defaulting to: ${FALLBACK_API_URL}`)
}
axios.defaults.baseURL = import.meta.env[API_URL_KEY] || FALLBACK_API_URL

const app = createApp(App)

app.use(IonicVue, { mode: 'ios' })
app.use(router)
app.use(pinia)
app.use(i18n)
app.use(VueAxios, axios)
app.provide('axios', app.config.globalProperties.axios)

router.isReady().then(() => { app.mount('#app') })
