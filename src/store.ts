import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { Chat, Message, State } from './types'

export const defaultNumQrCodes = 10
export const defaultBytesPerQrCode = 400

const initialState: State = {
  id: null,
  chats: [],
  lastTimestamp: null,
  numQrCodes: defaultNumQrCodes,
  bytesPerQrCode: defaultBytesPerQrCode,
  showEnablePushNotifications: true,
}

export default new Vuex.Store({
  plugins: [createPersistedState()],
  mutations: {
    setId(state, id: string | null) {
      state.id = id
    },
    setShowEnablePushNotifications(state, showEnablePushNotifications: boolean) {
      state.showEnablePushNotifications = showEnablePushNotifications
    },
    setNumQrCodes(state, numQrCodes: number) {
      state.numQrCodes = numQrCodes
    },
    setBytesPerQrCode(state, bytesPerQrCode: number) {
      state.bytesPerQrCode = bytesPerQrCode
    },
    setLastTimestamp(state, lastTimestamp: number | null) {
      state.lastTimestamp = lastTimestamp
    },
    addMessage(state, payload: { chatId: string, message: Message }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      const newMessages = state.chats[chatIdx].messages.slice()
      newMessages.push(payload.message)
      state.chats[chatIdx].messages = newMessages
    },
    syncDeletedMessage(state, payload: { chatId: string, messageId: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      const messageIdx = state.chats[chatIdx].messages.findIndex(message => message.id === payload.messageId)
      const newMessage = { ...state.chats[chatIdx].messages[messageIdx] }
      newMessage.synced = true
      delete newMessage.base64Key
      state.chats[chatIdx].messages[messageIdx] = newMessage
    },
    syncSentMessage(state, payload: { chatId: string, messageId: string, timestamp: number }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      const messageIdx = state.chats[chatIdx].messages.findIndex(message => message.id === payload.messageId)
      const newMessage = { ...state.chats[chatIdx].messages[messageIdx] }
      newMessage.synced = true
      newMessage.timestamp = payload.timestamp
      delete newMessage.payload
      state.chats[chatIdx].messages[messageIdx] = newMessage
    },
    deleteChat(state, chatId: string) {
      state.chats = state.chats.filter(chat => chat.id !== chatId)
    },
    deleteMessage(state, payload: { chatId: string, messageId: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      const newMessages = state.chats[chatIdx].messages.filter(message => message.id !== payload.messageId)
      state.chats[chatIdx].messages = newMessages
    },
    deleteAllMessages(state, chatId: string) {
      const chatIdx = state.chats.findIndex(chat => chat.id === chatId)
      state.chats[chatIdx].messages = []
    },
    updateMessage(state, payload: { chatId: string, message: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].message = payload.message
    },
    updateOwnKey(state, payload: { chatId: string, ownKey: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].ownKey = payload.ownKey
    },
    updateOtherKey(state, payload: { chatId: string, otherKey: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].otherKey = payload.otherKey
    },
    setHasNewMessage(state, payload: { chatId: string, hasNewMessage: boolean }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].hasNewMessage = payload.hasNewMessage
    },
    createChat(state, chat: Chat) {
      const newChats = state.chats.slice()
      newChats.push(chat)
      state.chats = newChats
    },
    setChatName(state, payload: { chatId: string, name: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].name = payload.name
    },
    setChatOtherId(state, payload: { chatId: string, otherId: string }) {
      const chatIdx = state.chats.findIndex(chat => chat.id === payload.chatId)
      state.chats[chatIdx].otherId = payload.otherId
    },
  },
  state: initialState,
})
