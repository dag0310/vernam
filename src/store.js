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
    },
    setConversationName (state, conversation) {
      const idx = state.conversations.findIndex(c => c.id === conversation.id)
      state.conversations[idx].name = conversation.name
    },
    setConversationOtherId (state, conversation) {
      const idx = state.conversations.findIndex(c => c.id === conversation.id)
      state.conversations[idx].otherId = conversation.otherId
    },
  },
  getters: {
    currentConversation (state) {
      return state.conversations.find(conversation => conversation.id === state.currentConversationId)
    }
  },
  state: {
    conversations: [],
    currentConversationId: null,
    id: null,
    countryCode: null
  }
})
