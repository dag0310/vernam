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
    setShowEnablePushNotifications (state, value) {
      state.showEnablePushNotifications = value
    },
    setNumQrCodes (state, value) {
      state.numQrCodes = value
    },
    setBytesPerQrCode (state, value) {
      state.bytesPerQrCode = value
    },
    setLastTimestamp (state, lastTimestamp) {
      state.lastTimestamp = lastTimestamp
    },
    setCurrentChatId (state, id) {
      state.currentChatId = id
    },
    deleteChat (state, id) {
      const idx = state.chats.findIndex(chat => chat.id === id)
      state.chats.splice(idx, 1)
    },
    deleteMessage (state, id) {
      const idx = this.getters.currentChat.messages.findIndex(message => message.id === id)
      this.getters.currentChat.messages.splice(idx, 1)
    },
    deleteAllMessages (state, id) {
      state.chats.find(chat => chat.id === id).messages = []
    },
    updateMessage (state, newValue) {
      this.getters.currentChat.message = newValue
    },
    updateOwnKey (state, newValue) {
      this.getters.currentChat.ownKey = newValue
    },
    updateOtherKey (state, newValue) {
      const idx = state.chats.findIndex(chat => chat.id === newValue.id)
      state.chats[idx].otherKey = newValue.otherKey
    },
    setNewMessagesTrue (state, id) {
      const idx = state.chats.findIndex(chat => chat.id === id)
      state.chats[idx].newMessages = true
    },
    setNewMessagesFalse (state, id) {
      const idx = state.chats.findIndex(chat => chat.id === id)
      state.chats[idx].newMessages = false
    },
    createChat (state, chat) {
      state.chats.push(chat)
    },
    setChatName (state, chat) {
      const idx = state.chats.findIndex(c => c.id === chat.id)
      state.chats[idx].name = chat.name
    },
    setChatOtherId (state, chat) {
      const idx = state.chats.findIndex(c => c.id === chat.id)
      state.chats[idx].otherId = chat.otherId
    },
  },
  getters: {
    currentChat (state) {
      return state.chats.find(chat => chat.id === state.currentChatId)
    }
  },
  state: {
    id: null,
    showEnablePushNotifications: true,
    chats: [],
    currentChatId: null,
    lastTimestamp: null,
    numQrCodes: 10,
    bytesPerQrCode: 400,
  }
})
