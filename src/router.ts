import { createRouter, createMemoryHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

import RefillKeyPassivePage from '@/views/RefillKeyPassivePage.vue'
import RefillKeyActivePage from '@/views/RefillKeyActivePage.vue'
import HomePage from './views/HomePage.vue'
import SettingsPage from './views/SettingsPage.vue'
import ChatPage from './views/ChatPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/settings',
    component: SettingsPage,
  },
  {
    path: '/chat',
    component: ChatPage,
  },
  {
    path: '/show',
    component: RefillKeyPassivePage,
  },
  {
    path: '/scan',
    component: RefillKeyActivePage,
  },
]

export default createRouter({
  history: createMemoryHistory(import.meta.env.BASE_URL),
  routes,
})
