import { createApp } from 'vue'
import axios from 'axios'
import { IonicVue } from '@ionic/vue'
import VueAxios from 'vue-axios'
import App from './App.vue'
import router from './router'
import store from './store'
import global from './global'
import i18n from './i18n'

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

/* Theme variables */
import './theme/variables.css'

const app = createApp(App)

app.config.globalProperties.$global = global

const API_URL_KEY = 'VITE_API_URL'
const FALLBACK_API_URL = 'http://localhost:3000'
if (import.meta.env[API_URL_KEY] == null) {
  console.warn(`Please specify ${API_URL_KEY} in the environment file. Defaulting to ${FALLBACK_API_URL}`)
}
axios.defaults.baseURL = import.meta.env[API_URL_KEY] || FALLBACK_API_URL

app.use(VueAxios, axios)
app.use(IonicVue, {
  mode: 'ios',
})
app.use(router)
app.use(store)
app.use(i18n)

router.isReady().then(() => {
  app.mount('#app')
})
