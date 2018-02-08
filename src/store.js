import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    global: {
      namespaced: true,
      state: {
        currentConversation: null
      }
    }
  }
})
