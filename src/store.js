import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createPersistedState()],
  mutations: {
    setId (state, id) {
      state.id = id
    },
    setAuthToken (state, authToken) {
      state.authToken = authToken
    },
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
    },
    updateOwnKey (state, newValue) {
      this.getters.currentConversation.ownKey = newValue
    },
    updateOtherKey (state, newValue) {
      const idx = state.conversations.findIndex(conversation => conversation.id === newValue.id)
      state.conversations[idx].otherKey = newValue.otherKey
    },
    setNewMessagesTrue (state, id) {
      const idx = state.conversations.findIndex(conversation => conversation.id === id)
      state.conversations[idx].newMessages = true
    },
    setNewMessagesFalse (state, id) {
      const idx = state.conversations.findIndex(conversation => conversation.id === id)
      state.conversations[idx].newMessages = false
    },
    createConversation (state, conversation) {
      state.conversations.push(conversation)
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
        messages: [],
        message: '',
        newMessages: false,
        ownKey: btoa((new TextDecoder()).decode(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5]))),
        otherKey: btoa((new TextDecoder()).decode(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1])))
      },
      {
        id: '00436801234567',
        name: 'Daniel Geymayer',
        messages: [],
        message: '',
        newMessages: false,
        ownKey: btoa((new TextDecoder()).decode(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1]))),
        otherKey: btoa((new TextDecoder()).decode(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5])))
      }
    ],
    currentConversationId: null,
    id: '00436801234567',
    authToken: '123'
  }
})
