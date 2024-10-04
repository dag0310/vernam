import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

import { Chat, Message, State } from './types'

export const defaultNumQrCodes = 10
export const defaultBytesPerQrCode = 500

export function getChat(state: State, chatId: string): Chat {
  const chat = state.chats.find((c: Chat) => c.id === chatId)
  if (chat == null) {
    throw Error(`Chat with ID '${chatId}' does not exist.`)
  }
  return chat
}

export default defineStore({
  id: 'vuex',
  persist: true,
  state: (): State => ({
    id: uuidv4(),
    chats: [],
    lastTimestamp: null,
    numQrCodes: defaultNumQrCodes,
    bytesPerQrCode: defaultBytesPerQrCode,
    showEnablePushNotifications: true,
  }),
  actions: {
    addMessage(chatId: string, message: Message) {
      getChat(this, chatId).messages.push(message)
    },
    syncDeletedMessage(chatId: string, messageId: string) {
      const chatIdx = this.chats.findIndex(chat => chat.id === chatId)
      const messageIdx = this.chats[chatIdx].messages.findIndex(message => message.id === messageId)
      const newMessage = { ...this.chats[chatIdx].messages[messageIdx] }
      newMessage.synced = true
      delete newMessage.base64Key
      this.chats[chatIdx].messages[messageIdx] = newMessage
    },
    syncSentMessage(chatId: string, messageId: string, timestamp: number) {
      const chatIdx = this.chats.findIndex(chat => chat.id === chatId)
      const messageIdx = this.chats[chatIdx].messages.findIndex(message => message.id === messageId)
      const newMessage = { ...this.chats[chatIdx].messages[messageIdx] }
      newMessage.synced = true
      newMessage.timestamp = timestamp
      delete newMessage.payload
      this.chats[chatIdx].messages[messageIdx] = newMessage
    },
    deleteChat(chatId: string) {
      this.chats = this.chats.filter(chat => chat.id !== chatId)
    },
    deleteMessage(chatId: string, messageId: string) {
      const chat = getChat(this, chatId)
      chat.messages = chat.messages.filter(message => message.id !== messageId)
    },
    deleteAllMessages(chatId: string) {
      const chatIdx = this.chats.findIndex(chat => chat.id === chatId)
      this.chats[chatIdx].messages = []
    },
    updateMessage(chatId: string, message: string) {
      const chatIdx = this.chats.findIndex(chat => chat.id === chatId)
      this.chats[chatIdx].message = message
    },
    updateOwnKey(chatId: string, ownKey: string) {
      getChat(this, chatId).ownKey = ownKey
    },
    updateOtherKey(chatId: string, otherKey: string) {
      getChat(this, chatId).otherKey = otherKey
    },
    setHasNewMessage(chatId: string, hasNewMessage: boolean) {
      getChat(this, chatId).hasNewMessage = hasNewMessage
    },
    setChatOtherId(chatId: string, otherId: string | null) {
      getChat(this, chatId).otherId = otherId
    },
  },
})
