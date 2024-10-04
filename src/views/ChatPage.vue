<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('back')" />
        </ion-buttons>
        <ion-title @click="showInformationDialog()" style="cursor: pointer">{{ chat.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refillKey()">
            <span :style="{ color: (otpCryptoResult.bytesLeft < 0) ? 'var(--ion-color-danger)' : 'inherit' }">🔑 {{ keyEmpty ? 0 : (chat.message.trim().length <= 0) ? otpCryptoResultWithoutPreamble.bytesLeft : otpCryptoResult.bytesLeft }}</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-show="searchText.length > 0 || filteredMessages.length > 0">
        <ion-searchbar v-model="searchText" :placeholder="t('searchbarPlaceholder')" />
      </ion-toolbar>
    </ion-header>
    <ion-content ref="content" class="ion-padding-bottom" :fullscreen="true">
      <ion-list v-show="filteredMessages.length > 0" class="ion-margin-top" lines="none" :detail="false" ref="messagesList">
        <ion-item-sliding v-for="message in filteredMessages" :key="message.id">
          <ion-item>
            <ion-card :color="message.own ? 'primary' : 'light'" :slot="message.own ? 'end' : ''">
              <ion-card-content style="display: flex; flex-direction: row; flex-wrap: wrap; row-gap: 3px; column-gap: 10px;">
                <div v-html="message.html" style="user-select: text; overflow-wrap: anywhere; white-space: pre-wrap;" />
                <div class="time ion-text-nowrap">{{ dateTimeText(message.timestamp) }}</div>
              </ion-card-content>
            </ion-card>
          </ion-item>
          <ion-item-options @ion-swipe="showDeleteMessageDialog(message.id, message.text)" side="end">
            <ion-item-option @click="showDeleteMessageDialog(message.id, message.text)" color="danger" expandable>
              <ion-icon slot="top" :icon="ionIconTrash" />
              {{ t('delete') }}
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div class="ion-padding-horizontal" style="display: flex; flex-direction: column; flex-wrap: nowrap; gap: 1rem;">
        <div class="ion-margin-top info-text" v-if="filteredMessages.length <= 0 && searchText.length > 0">{{ t('noMessagesFoundMessage') }}</div>
        <div class="ion-margin-top info-text" v-if="chat.otherId == null && !keyEmpty">{{ t('noOtherIdMessage') }}</div>
        <div class="ion-margin-top" style="text-align: center;" v-if="keyAlmostEmpty || otherKeyAlmostEmpty">
          <div class="info-text" v-if="keyAlmostEmpty">{{ keyEmpty ? t('keyEmptyMessage') : t('keyAlmostEmptyMessage') }}</div>
          <div class="info-text" v-if="otherKeyAlmostEmpty">{{ otherKeyEmpty ? t('otherKeyEmptyMessage') : t('otherKeyAlmostEmptyMessage') }}</div>
          <div class="info-text">{{ t('refillKeyMessage') }}</div>
          <ion-button @click="refillKey()" class="ion-margin-top">{{ t('refillKey') }} 🔑</ion-button>
        </div>
      </div>
    </ion-content>
    <ion-footer :translucent="true">
      <ion-toolbar>
        <ion-textarea v-model="chat.message" :placeholder="t('message')" :auto-grow="true" :disabled="!lastOwnMessageSynced" autocomplete="off" wrap="soft" :rows="1" mode="md" fill="outline">
          <ion-button @click="sendMessage()" :disabled="(isSendingMessage || !chat.otherId) || (lastOwnMessageSynced && (chat.message.trim().length <= 0 || !otpCryptoResult.isKeyLongEnough))" fill="clear" slot="end" :aria-label="t('send')">
            <ion-icon slot="icon-only" :icon="ionIconSend" />
          </ion-button>
        </ion-textarea>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonFooter, IonToolbar, IonIcon, IonSearchbar, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardContent, IonButtons, IonBackButton, IonTitle, IonContent, IonTextarea, IonButton, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { trash as ionIconTrash, send as ionIconSend } from 'ionicons/icons'
import { computed, inject, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AxiosError } from 'axios'

import { v4 as uuidv4 } from 'uuid'
import OtpCrypto from 'otp-crypto'

import { ApiMessageRequestBody, ApiMessageResponseBody, Chat, FilteredMessage } from '../types'
import { AUTH_PREAMBLE, handleUnexpectedError, humanizeDate, isMessageVisible, showToast } from '../mixin'
import useStore, { getChat } from '../store'
import useGlobalStore from '../global'

const store = useStore()
const global = useGlobalStore()
const router = useRouter()
const { t } = useI18n()
const contentRef = useTemplateRef('content')
const messagesListRef = useTemplateRef('messagesList')

const axios: any = inject('axios')
const keyAlmostEmptyThreshold = 100
const scrollToBottomTimeoutInMs = 500 // Small timeout necessary, otherwise much less reliable to scroll down

const searchText = ref('')
const isSendingMessage = ref(false)

function scrollToBottom(): void {
  setTimeout(() => {
    (contentRef.value as any)?.$el.scrollToBottom(0)
  }, scrollToBottomTimeoutInMs)
}

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scrollToBottom()
    }
  })
  scrollToBottom()
  global.pollingActive = true
  onIonViewDidEnter(() => {
    scrollToBottom()
    global.pollingActive = true
  })
  // DEBUGGING
  // global.debugString = JSON.stringify(JSON.parse(localStorage.vuex))
})

const chat = computed(() => store.chats.find((c: Chat) => c.id === global.currentChatId) as Chat)

const filteredMessages = computed((): FilteredMessage[] => chat.value.messages
  .filter(message => isMessageVisible(message) && message.text.toUpperCase().includes(searchText.value.toUpperCase()))
  .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
  .map(message => {
    const tempDiv = document.createElement('div')
    tempDiv.appendChild(document.createTextNode(message.text))
    return {
      id: message.id,
      own: message.own,
      text: message.text,
      html: tempDiv.innerHTML.trim().replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: inherit;">$1</a>'),
      timestamp: message.timestamp,
    }
  }))

const lastFilteredMessage = computed(() => filteredMessages.value.at(-1))
const ownKey = computed(() => OtpCrypto.encryptedDataConverter.base64ToBytes(chat.value.ownKey))
const otherKey = computed(() => OtpCrypto.encryptedDataConverter.base64ToBytes(chat.value.otherKey))
const keyAlmostEmpty = computed(() => OtpCrypto.encrypt('', ownKey.value).remainingKey.length - keyAlmostEmptyThreshold < 0) // Empty string necessary, otherwise key almost empty too soon (e.g. 106 if threshold is 100)
const otherKeyAlmostEmpty = computed(() => OtpCrypto.encrypt('', otherKey.value).remainingKey.length - keyAlmostEmptyThreshold < 0) // Empty string necessary, otherwise key almost empty too soon (e.g. 106 if threshold is 100)
const keyEmpty = computed(() => OtpCrypto.encrypt(AUTH_PREAMBLE, ownKey.value).remainingKey.length <= 0)
const otherKeyEmpty = computed(() => OtpCrypto.encrypt(AUTH_PREAMBLE, otherKey.value).remainingKey.length <= 0)
const otpCryptoResult = computed(() => OtpCrypto.encrypt(AUTH_PREAMBLE + chat.value.message, ownKey.value))
const otpCryptoResultWithoutPreamble = computed(() => OtpCrypto.encrypt(chat.value.message, ownKey.value))
const lastOwnMessage = computed(() => chat.value.messages.filter(message => message.own).at(-1))
const lastOwnMessageSynced = computed(() => lastOwnMessage.value?.synced ?? true)

watch(
  lastFilteredMessage,
  async (newMessage, oldMessage) => {
    if (newMessage?.id !== oldMessage?.id) {
      scrollToBottom()
    }
  },
  { flush: 'post' },
)
watch(() => chat.value.otherId, () => { scrollToBottom() }, { flush: 'post' })
watch(keyAlmostEmpty, () => { scrollToBottom() }, { flush: 'post' })
watch(otherKeyAlmostEmpty, () => { scrollToBottom() }, { flush: 'post' })

async function refillKey(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('refillKeyActionSheetHeader'),
    buttons: [
      {
        text: t('refillKeyActionSheetShowText'),
        handler: (): void => {
          router.push('/show')
        },
      },
      {
        text: t('refillKeyActionSheetScanText'),
        handler: (): void => {
          router.push('/scan')
        },
      },
      {
        text: t('cancel'),
        role: 'cancel',
      },
    ],
  })
  await actionSheet.present()
}

async function sendMessage(): Promise<void> {
  if (!chat.value.otherId) {
    showToast(t('otherIdNotSet'))
    return
  }
  isSendingMessage.value = true
  let requestBody: ApiMessageRequestBody
  if (lastOwnMessageSynced.value === true) {
    if (!otpCryptoResult.value.isKeyLongEnough) {
      showToast(t('keyNotLongEnough'))
      isSendingMessage.value = false
      return
    }
    requestBody = {
      id: uuidv4(),
      sender: store.id,
      receiver: chat.value.otherId,
      payload: otpCryptoResult.value.base64Encrypted,
    }
    const newMessage = {
      id: requestBody.id,
      own: true,
      text: chat.value.message,
      payload: requestBody.payload,
      timestamp: new Date().getTime(),
      synced: false,
    }
    store.addMessage(chat.value.id, newMessage)
    store.updateOwnKey(chat.value.id, OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.value.remainingKey))
  } else {
    showToast(t('syncingMessages'))
    if (lastOwnMessage.value == null) {
      showToast(t('lastOwnMessageNotExistsError'))
      throw Error(t('lastOwnMessageNotExistsError'))
    }
    if (lastOwnMessage.value.payload == null) {
      showToast(t('postMessageSyncError'))
      throw Error(t('postMessageSyncError'))
    }
    requestBody = {
      id: lastOwnMessage.value.id,
      sender: store.id,
      receiver: chat.value.otherId,
      payload: lastOwnMessage.value.payload,
    }
  }
  try {
    const response = await axios.post('messages', requestBody, { timeout: 5000 })
    const { timestamp } = (response.data as ApiMessageResponseBody)
    if (lastOwnMessage.value == null) {
      showToast(`[Retry] ${t('lastOwnMessageNotExistsError')}`)
      throw Error(`[Retry] ${t('lastOwnMessageNotExistsError')}`)
    }
    store.syncSentMessage(chat.value.id, lastOwnMessage.value.id, timestamp)
    chat.value.message = ''
  } catch (error) {
    const { response } = error as AxiosError
    if (response) {
      handleUnexpectedError((error as AxiosError))
    } else {
      showToast(t('networkError'))
    }
  } finally {
    isSendingMessage.value = false
  }
}

async function showDeleteAllMessagesDialog(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('deleteAllMessagesLocallyTitle'),
    buttons: [
      {
        text: t('deleteAllMessagesLocally'),
        role: 'destructive',
        handler: (): void => {
          store.deleteAllMessages(chat.value.id)
        },
      },
      {
        text: t('cancel'),
        role: 'cancel',
      },
    ],
  })
  await actionSheet.present()
}

async function showInformationDialog(): Promise<void> {
  const inputs = [
    {
      value: chat.value.name,
      placeholder: t('chatNamePlaceholder'),
      attributes: { autocapitalize: 'on' },
    },
  ]
  const buttons = [
    {
      text: t('saveChatName'),
      role: 'confirm',
      handler: (value: any): boolean => {
        const name = value[0]
        if (name.trim() === '') {
          showToast(t('enterChatNameMessage'))
          return false
        }
        getChat(store, chat.value.id).name = name
        return true
      },
    },
    {
      text: t('refillKey'),
      handler: (): void => {
        refillKey()
      },
    },
    {
      text: t('deleteChatHistory'),
      role: 'destrutive',
      handler: (): void => {
        showDeleteAllMessagesDialog()
      },
    },
    {
      text: t('cancel'),
      role: 'cancel',
    },
  ]
  await (await alertController.create({
    header: t('chat'),
    subHeader: `${t('ownKey')}: ${ownKey.value.length} ${t('bytes')}`,
    message: `${t('otherKey')}: ${otherKey.value.length} ${t('bytes')}`,
    inputs,
    buttons,
  })).present()
}

async function showDeleteMessageDialog(messageId: string, headerText: string): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: headerText.substring(0, 100),
    buttons: [
      {
        text: t('deleteMessageLocally'),
        role: 'destructive',
        handler: (): void => {
          store.deleteMessage(chat.value.id, messageId)
        },
      },
      {
        text: t('cancel'),
        role: 'cancel',
        handler: (): void => {
          (messagesListRef.value as any)?.$el.closeSlidingItems()
        },
      },
    ],
  })
  await actionSheet.present()
}

function dateTimeText(timestamp: number): string {
  const humanDate = humanizeDate(timestamp)
  return humanDate.isToday ? humanDate.timeText : `${humanDate.dateText}, ${humanDate.timeText}`
}
</script>

<style scoped>
ion-card {
  max-width: min(80%, 500px);
  margin: var(--message-padding) 0;
}
ion-card ion-card-content {
  padding-inline-start: var(--message-padding);
  padding-inline-end: var(--message-padding);
  padding-top: var(--message-padding);
  padding-bottom: var(--message-padding);
  line-height: 1.25;
}
ion-card .time {
  align-self: end;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

ion-textarea {
  --background: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.07);
  --padding-top: var(--message-padding);
  --padding-bottom: var(--message-padding);
}
.textarea-fill-outline {
  --padding-start: var(--message-padding);
  --padding-end: var(--message-padding);
}
</style>
