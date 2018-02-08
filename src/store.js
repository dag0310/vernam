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
            messages: [
              {
                id: 1,
                senderId: 1,
                text: 'Hallo Daniel!',
                timestamp: 1517757771000,
                sent: true
              },
              {
                id: 2,
                senderId: -1,
                text: 'Oh hi, John!',
                timestamp: 1517757775000,
                sent: true
              },
              {
                id: 3,
                senderId: 1,
                text: 'Wir können gsd bis vor die whg fahren mit dem auto, das wird super!',
                timestamp: 1517757979000,
                sent: true
              }
            ]
          },
          {
            id: 2,
            name: 'Aaron A. Aaronson',
            messages: [
              {
                id: 1,
                senderId: 2,
                text: 'Wenn du meinst, aber ich bin mir nicht sicher :/',
                timestamp: 1517864396599,
                sent: true
              }
            ]
          },
          {
            id: 3,
            name: 'Max Musterman',
            messages: [
              {
                id: 1,
                senderId: 3,
                text: 'Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊',
                timestamp: 1517324400000,
                sent: true
              }
            ]
          }
        ],
        currentConversation: null
      }
    }
  }
})
