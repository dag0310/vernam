import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    global: {
      namespaced: true,
      state: {
        conversations: [
          {
            id: 1,
            name: 'John Doe',
            lastMessage: 'Wir können gsd bis vor die whg fahren mit dem auto, das wird super!',
            lastTimestamp: 1517757771000
          },
          {
            id: 2,
            name: 'Aaron A. Aaronson',
            lastMessage: 'Wenn du meinst, aber ich bin mir nicht sicher :/',
            lastTimestamp: 1517864396599
          },
          {
            id: 3,
            name: 'Max Musterman',
            lastMessage: 'Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊',
            lastTimestamp: 1517324400000
          }
        ],
        currentConversation: null
      }
    }
  }
})
