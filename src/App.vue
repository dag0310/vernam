<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { AxiosError } from 'axios'
import OtpCrypto from 'otp-crypto'
import { inject, onMounted } from 'vue'

import { ApiMessageResponseBody, Message } from './types'
import { AUTH_PREAMBLE, handleUnexpectedError } from './mixin'
import useStore from './store'
import useGlobalStore from './global'

const store = useStore()
const global = useGlobalStore()
const axios: any = inject('axios')

const pollMessagesIntervalInMs = 1000

function isAuthenticatedPayload(payloadBase64: string, otherKeyBase64: string): boolean {
  const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(otherKeyBase64)
  const otpCryptoResult = OtpCrypto.decrypt(payloadBase64, otherKeyBytes)
  const payloadPreamble = otpCryptoResult.plaintextDecrypted.substring(0, AUTH_PREAMBLE.length)
  return payloadPreamble === AUTH_PREAMBLE
}

async function handleMessageOnServer(message: Message): Promise<boolean> {
  if (message.base64Key == null) {
    return true
  }
  try {
    await axios.delete(`messages/${message.id}/${encodeURIComponent(message.base64Key)}`, { timeout: 5000, headers: { 'Content-Type': 'text/plain' } })
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
        handleUnexpectedError((error as AxiosError), '[DELETE] ')
        return false
    }
  }
}

onMounted(() => {
  const pollMessages = async (): Promise<void> => {
    if (!store.id || !global.pollingActive) {
      setTimeout(() => { pollMessages() }, pollMessagesIntervalInMs)
      return
    }
    const params: { timestamp?: number } = {}
    if (store.lastTimestamp != null) {
      params.timestamp = store.lastTimestamp
    }
    try {
      const response = await axios.get(`messages/${store.id}`, { timeout: 5000, params })
      for (const message of response.data as ApiMessageResponseBody[]) {
        const senderChat = store.chats.find(chat => chat.otherId === message.sender)
        const chatCandidates = (senderChat != null) ? [senderChat] : store.chats.filter(chat => chat.otherId == null)
        const chat = chatCandidates.find(chatCandidate => isAuthenticatedPayload(message.payload, chatCandidate.otherKey))
        if (chat == null) {
          store.lastTimestamp = message.timestamp
          continue
        }

        if (chat.otherId == null) {
          store.setChatOtherId(chat.id, message.sender)
        }

        if (chat.messages.some(m => m.id === message.id)) {
          store.lastTimestamp = message.timestamp
          continue
        }

        const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(chat.otherKey)
        const otherKeyBytesPreambleLength = otherKeyBytes.slice(0, OtpCrypto.decryptedDataConverter.strToBytes(AUTH_PREAMBLE).length)
        const base64Key = OtpCrypto.encryptedDataConverter.bytesToBase64(otherKeyBytesPreambleLength)
        const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)

        store.updateOtherKey(chat.id, OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey))

        const newMessage: Message = {
          id: message.id,
          own: false,
          text: otpCryptoResult.plaintextDecrypted.substring(AUTH_PREAMBLE.length),
          timestamp: message.timestamp,
          synced: false,
          base64Key,
        }
        store.addMessage(chat.id, newMessage)

        if (global.currentChatId !== chat.id) {
          store.setHasNewMessage(chat.id, true)
        }
      }
      for (const chat of store.chats) {
        for (const message of chat.messages.filter(m => !m.own && !m.synced)) {
          // eslint-disable-next-line no-await-in-loop
          const messageHandled = await handleMessageOnServer(message)
          if (messageHandled) {
            store.lastTimestamp = message.timestamp
            store.syncDeletedMessage(chat.id, message.id)
          }
        }
      }
    } catch (error) {
      if ((error as AxiosError).response) {
        handleUnexpectedError(error as AxiosError, '[GET] ')
      }
    } finally {
      setTimeout(() => { pollMessages() }, pollMessagesIntervalInMs)
    }
  }
  pollMessages()
})
</script>

<style>
:root {
  --message-padding: 10px;
}

.ion-page {
  --ion-color-primary-contrast: white;
  --ion-color-danger-contrast: white;
}

.info-text {
  text-align: center;
  font-style: italic;
  color: var(--ion-color-medium);
}
</style>
