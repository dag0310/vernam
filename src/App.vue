<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { AxiosError } from 'axios'
import OtpCrypto from 'otp-crypto'

import mixin from './mixin'
import { ApiMessageResponseBody, Chat, Message } from './types'

const pollMessagesIntervalInMs = 1000

export default defineComponent({
  components: { IonApp, IonRouterOutlet },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  mounted() {
    const pollMessages = async () => {
      if (!this.$store.state.id || !this.$global.state.pollingActive) {
        setTimeout(() => { pollMessages() }, pollMessagesIntervalInMs)
        return
      }
      const params: { timestamp?: number } = {}
      if (this.lastTimestamp != null) {
        params.timestamp = this.lastTimestamp
      }
      try {
        const response = await this.$http.get(`messages/${this.$store.state.id}`, { timeout: 5000, params })
        for (const message of response.data as ApiMessageResponseBody[]) {
          const senderChat = this.chats.find(chat => chat.otherId === message.sender)
          const chatCandidates = (senderChat != null) ? [senderChat] : this.chats.filter(chat => chat.otherId == null)
          const chat = chatCandidates.find(chatCandidate => this.isAuthenticatedPayload(message.payload, chatCandidate.otherKey))
          if (chat == null) {
            this.lastTimestamp = message.timestamp
            continue
          }

          if (chat.otherId == null) {
            this.$store.commit('setChatOtherId', {
              chatId: chat.id,
              otherId: message.sender,
            })
          }

          if (chat.messages.some(m => m.id === message.id)) {
            this.lastTimestamp = message.timestamp
            continue
          }

          const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(chat.otherKey)
          const otherKeyBytesPreambleLength = otherKeyBytes.slice(0, OtpCrypto.decryptedDataConverter.strToBytes(this.AUTH_PREAMBLE).length)
          const base64Key = OtpCrypto.encryptedDataConverter.bytesToBase64(otherKeyBytesPreambleLength)
          const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)

          this.$store.commit('updateOtherKey', {
            chatId: chat.id,
            otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey),
          })

          const newMessage: Message = {
            id: message.id,
            own: false,
            text: otpCryptoResult.plaintextDecrypted.substring(this.AUTH_PREAMBLE.length),
            timestamp: message.timestamp,
            synced: false,
            base64Key,
          }
          this.$store.commit('addMessage', {
            chatId: chat.id,
            message: newMessage,
          })

          if (this.$store.state.currentChatId !== chat.id) {
            this.$store.commit('setHasNewMessage', {
              chatId: chat.id,
              hasNewMessage: true,
            })
          }
        }
        for (const chat of this.chats) {
          for (const message of chat.messages.filter(m => !m.own && !m.synced)) {
            const messageHandled = await this.handleMessageOnServer(message)
            if (messageHandled) {
              this.lastTimestamp = message.timestamp
              this.$store.commit('syncDeletedMessage', {
                chatId: chat.id,
                messageId: message.id,
              })
            }
          }
        }
      } catch (error) {
        if ((error as AxiosError).response) {
          this.handleUnexpectedError(error as AxiosError, '[GET] ')
        }
      } finally {
        setTimeout(() => { pollMessages() }, pollMessagesIntervalInMs)
      }
    }
    pollMessages()
  },
  computed: {
    chats(): Chat[] {
      return this.$store.state.chats
    },
    lastTimestamp: {
      get(): number {
        return this.$store.state.lastTimestamp
      },
      set(value: number) {
        return this.$store.commit('setLastTimestamp', value)
      },
    },
  },
  methods: {
    isAuthenticatedPayload(payloadBase64: string, otherKeyBase64: string) {
      const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(otherKeyBase64)
      const otpCryptoResult = OtpCrypto.decrypt(payloadBase64, otherKeyBytes)
      const payloadPreamble = otpCryptoResult.plaintextDecrypted.substring(0, this.AUTH_PREAMBLE.length)
      return payloadPreamble === this.AUTH_PREAMBLE
    },
    async handleMessageOnServer(message: Message) {
      if (message.base64Key == null) {
        return true
      }
      try {
        await this.$http.delete(`messages/${message.id}/${encodeURIComponent(message.base64Key)}`, { timeout: 5000, headers: { 'Content-Type': 'text/plain' } })
        return true
      } catch (error) {
        const { response } = error as AxiosError
        if (!response) {
          return false
        }
        switch (response.status) {
          case 400: // Message validation failed
          case 401: // Message authentication failed
          case 404: // Message not found
            return true
          default:
            this.handleUnexpectedError((error as AxiosError), '[DELETE] ')
            return false
        }
      }
    },
  },
})
</script>

<style>
:root {
  --message-padding: 10px;
}

.info-text {
  text-align: center;
  font-style: italic;
  color: var(--ion-color-medium);
}
</style>
