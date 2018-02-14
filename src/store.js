import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

const decoder = new TextDecoder('utf8')

Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createPersistedState()],
  mutations: {
    setCurrentConversationId (state, id) {
      state.currentConversationId = id
    },
    deleteConversation (state, id) {
      const idx = state.conversations.findIndex(conversation => conversation.id === id)
      state.conversations.splice(idx, 1)
    },
    deleteMessage (state, id) {
      const idx = this.getters.currentConversation.messages.findIndex(message => message.id === id)
      this.getters.currentConversation.messages.splice(idx, 1)
    },
    updateMessage (state, newValue) {
      this.getters.currentConversation.message = newValue
    }
  },
  getters: {
    currentConversation (state) {
      return state.conversations.find(conversation => conversation.id === state.currentConversationId)
    }
  },
  state: {
    conversations: [
      {
        id: '00436641234567',
        name: 'John Doe',
        messages: [
          {
            id: 1,
            own: false,
            text: 'Hi Daniel!',
            timestamp: 1517757771000,
            sent: true
          },
          {
            id: 2,
            own: true,
            text: 'Oh hi, John!',
            timestamp: 1517757775000,
            sent: true
          },
          {
            id: 3,
            own: false,
            text: 'We can drive right up to the flat, this is going to be amazing! :)',
            timestamp: 1517757979000,
            sent: true
          },
          {
            id: 4,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517767979000,
            sent: true
          },
          {
            id: 5,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517777979000,
            sent: true
          },
          {
            id: 6,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517787979000,
            sent: true
          },
          {
            id: 7,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517797979000,
            sent: true
          },
          {
            id: 8,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517807979000,
            sent: true
          },
          {
            id: 9,
            own: false,
            text: 'Always blue! Always blue!',
            timestamp: 1517817979000,
            sent: true
          },
          {
            id: 10,
            own: true,
            text: 'Last!',
            timestamp: 1517827979000,
            sent: true
          }
        ],
        message: '',
        ownKey: btoa(decoder.decode(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5]))),
        otherKey: btoa(decoder.decode(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1])))
      },
      {
        id: '00436991234567',
        name: 'Max Musterman',
        messages: [
          {
            id: 1,
            own: false,
            text: 'Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊 Ok 😊',
            timestamp: 1517324400000,
            sent: true
          }
        ],
        message: '',
        ownKey: btoa(decoder.decode(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1]))),
        otherKey: btoa(decoder.decode(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5])))
      },
      {
        id: '00436001234567',
        name: 'Aaron A. Aaronson',
        messages: [
          {
            id: 1,
            own: false,
            text: 'if you say so, i am not so sure though :/',
            timestamp: 1517864396599,
            sent: true
          }
        ],
        message: '',
        ownKey: btoa(decoder.decode(Uint8Array.from([]))),
        otherKey: btoa(decoder.decode(Uint8Array.from([])))
      }
    ],
    currentConversationId: null,
    id: '00436801234567',
    authToken: '123'
  }
})
