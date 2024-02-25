<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="$t('back')"></ion-back-button>
        </ion-buttons>
        <ion-title @click="showInformationDialog()" style="cursor: pointer">{{ chat.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refillKey()">
            <span :style="{ color: (otpCryptoResult.bytesLeft < 0) ? 'var(--ion-color-danger)' : 'inherit' }">🔑 {{ keyEmpty ? 0 : (message.trim().length <= 0) ? otpCryptoResultWithoutPreamble.bytesLeft : otpCryptoResult.bytesLeft }}</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-show="searchText.length > 0 || filteredMessages.length > 0">
        <ion-searchbar v-model="searchText" :placeholder="$t('searchbarPlaceholder')"></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content ref="content" class="ion-padding-bottom" :fullscreen="true">
      <ion-list v-show="filteredMessages.length > 0" class="ion-margin-top" lines="none" :detail="false" ref="messagesList">
        <ion-item-sliding v-for="message in filteredMessages" :key="message.id">
          <ion-item>
            <ion-card :color="message.own ? 'primary' : 'light'" :slot="message.own ? 'end' : ''">
              <ion-card-content style="display: flex; flex-direction: row; flex-wrap: wrap; row-gap: 3px; column-gap: 10px;">
                <div v-html="message.html" style="user-select: text; overflow-wrap: anywhere; white-space: pre-wrap;"></div>
                <div class="time ion-text-nowrap">{{ dateTimeText(message.timestamp) }}</div>
              </ion-card-content>
            </ion-card>
          </ion-item>
          <ion-item-options @ion-swipe="showDeleteMessageDialog(message.id, message.text)" side="end">
            <ion-item-option @click="showDeleteMessageDialog(message.id, message.text)" color="danger" expandable>
              <ion-icon slot="top" :icon="ionIconTrash"></ion-icon>
              {{ $t('delete') }}
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div class="ion-padding-horizontal" style="display: flex; flex-direction: column; flex-wrap: nowrap; gap: 1rem;">
        <div class="ion-margin-top info-text" v-if="filteredMessages.length <= 0 && searchText.length > 0">{{ $t('noMessagesFoundMessage') }}</div>
        <div class="ion-margin-top info-text" v-if="chat.otherId == null && !keyEmpty">{{ $t('noOtherIdMessage') }}</div>
        <div class="ion-margin-top" style="text-align: center;" v-if="keyAlmostEmpty || otherKeyAlmostEmpty">
          <div class="info-text" v-if="keyAlmostEmpty">{{ keyEmpty ? $t('keyEmptyMessage') : $t('keyAlmostEmptyMessage') }}</div>
          <div class="info-text" v-if="otherKeyAlmostEmpty">{{ otherKeyEmpty ? $t('otherKeyEmptyMessage') : $t('otherKeyAlmostEmptyMessage') }}</div>
          <div class="info-text">{{ $t('refillKeyMessage') }}</div>
          <ion-button @click="refillKey()" class="ion-margin-top">{{ $t('refillKey') }} 🔑</ion-button>
        </div>
      </div>
    </ion-content>
    <ion-footer :translucent="true">
      <ion-toolbar>
        <ion-textarea v-model="message" :placeholder="$t('message')" :auto-grow="true" :disabled="!lastOwnMessageSynced" autocomplete="off" wrap="soft" :rows="1" mode="md" fill="outline">
          <ion-button @click="sendMessage()" :disabled="(isSendingMessage || !chat.otherId) || (lastOwnMessageSynced && (message.trim().length <= 0 || !otpCryptoResult.isKeyLongEnough))" fill="clear" slot="end" :aria-label="$t('send')">
            <ion-icon slot="icon-only" :icon="ionIconSend"></ion-icon>
          </ion-button>
        </ion-textarea>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonFooter, IonToolbar, IonIcon, IonSearchbar, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardContent, IonButtons, IonBackButton, IonTitle, IonContent, IonTextarea, IonButton, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { close as ionIconClose, trash as ionIconTrash, create as ionIconCreate, send as ionIconSend } from 'ionicons/icons'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { AxiosError } from 'axios'

import { v4 as uuidv4 } from 'uuid'
import OtpCrypto from 'otp-crypto'

import mixin from '../mixin'
import { ApiMessageRequestBody, ApiMessageResponseBody, Chat, FilteredMessage } from '../types'

const keyAlmostEmptyThreshold = 100
const scrollToBottomTimeoutInMs = 500 // Small timeout necessary, otherwise much less reliable to update

export default defineComponent({
  components: { IonPage, IonHeader, IonFooter, IonToolbar, IonIcon, IonSearchbar, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardContent, IonButtons, IonBackButton, IonTitle, IonContent, IonTextarea, IonButton },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  data(): {
    searchText: string,
    isSendingMessage: boolean,
    ionIconClose: string,
    ionIconTrash: string,
    ionIconCreate: string,
    ionIconSend: string,
  } {
    return {
      searchText: '',
      isSendingMessage: false,
      ionIconClose,
      ionIconTrash,
      ionIconCreate,
      ionIconSend,
    }
  },
  mounted() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.scrollToBottom()
      }
    })
    this.scrollToBottom()
    this.$global.state.pollingActive = true
    onIonViewDidEnter(() => {
      this.scrollToBottom()
      this.$global.state.pollingActive = true
    })
    // DEBUGGING
    // this.$global.state.debugString = JSON.stringify(JSON.parse(localStorage.vuex))
  },
  watch: {
    lastFilteredMessage: {
      async handler(newMessage: FilteredMessage, oldMessage: FilteredMessage) {
        if (newMessage?.id !== oldMessage?.id) {
          setTimeout(() => { this.scrollToBottom() }, scrollToBottomTimeoutInMs)
        }
      },
      flush: 'post',
    },
    'chat.otherId': {
      handler() {
        setTimeout(() => { this.scrollToBottom() }, scrollToBottomTimeoutInMs)
      },
      flush: 'post',
    },
    keyAlmostEmpty: {
      handler() {
        setTimeout(() => { this.scrollToBottom() }, scrollToBottomTimeoutInMs)
      },
      flush: 'post',
    },
    otherKeyAlmostEmpty: {
      handler() {
        setTimeout(() => { this.scrollToBottom() }, scrollToBottomTimeoutInMs)
      },
      flush: 'post',
    },
  },
  computed: {
    chat(): Chat {
      return this.$store.state.chats.find((chat: Chat) => chat.id === this.$global.state.currentChatId)
    },
    message: {
      get() {
        return this.chat.message
      },
      set(message: string) {
        this.$store.commit('updateMessage', {
          chatId: this.chat.id,
          message,
        })
      },
    },
    filteredMessages(): FilteredMessage[] {
      return this.chat.messages
        .filter(message => this.isMessageVisible(message) && message.text.toUpperCase().includes(this.searchText.toUpperCase()))
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
        })
    },
    lastFilteredMessage() {
      return this.filteredMessages.at(-1)
    },
    ownKey() {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.chat.ownKey)
    },
    otherKey() {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.chat.otherKey)
    },
    keyAlmostEmpty() {
      // Empty string necessary, otherwise key almost empty too soon (e.g. 106 if threshold is 100)
      return OtpCrypto.encrypt('', this.ownKey).remainingKey.length - keyAlmostEmptyThreshold < 0
    },
    otherKeyAlmostEmpty() {
      // Empty string necessary, otherwise key almost empty too soon (e.g. 106 if threshold is 100)
      return OtpCrypto.encrypt('', this.otherKey).remainingKey.length - keyAlmostEmptyThreshold < 0
    },
    keyEmpty() {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.ownKey).remainingKey.length <= 0
    },
    otherKeyEmpty() {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.otherKey).remainingKey.length <= 0
    },
    otpCryptoResult() {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE + this.message, this.ownKey)
    },
    otpCryptoResultWithoutPreamble() {
      return OtpCrypto.encrypt(this.message, this.ownKey)
    },
    lastOwnMessage() {
      return this.chat.messages.filter(message => message.own).at(-1)
    },
    lastOwnMessageSynced() {
      return this.lastOwnMessage?.synced ?? true
    },
  },
  methods: {
    async refillKey() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('refillKeyActionSheetHeader'),
        buttons: [
          {
            text: this.$t('refillKeyActionSheetShowText'),
            handler: () => {
              this.$router.push('/show')
            },
          },
          {
            text: this.$t('refillKeyActionSheetScanText'),
            handler: () => {
              this.$router.push('/scan')
            },
          },
          {
            text: this.$t('cancel'),
            role: 'cancel',
          },
        ],
      })
      await actionSheet.present()
    },
    async sendMessage() {
      if (!this.chat.otherId) {
        this.showToast(this.$t('otherIdNotSet'))
        return
      }
      this.isSendingMessage = true
      let requestBody: ApiMessageRequestBody
      if (this.lastOwnMessageSynced) {
        if (!this.otpCryptoResult.isKeyLongEnough) {
          this.showToast(this.$t('keyNotLongEnough'))
          this.isSendingMessage = false
          return
        }
        requestBody = {
          id: uuidv4(),
          sender: this.$store.state.id,
          receiver: this.chat.otherId,
          payload: this.otpCryptoResult.base64Encrypted,
        }
        const newMessage = {
          id: requestBody.id,
          own: true,
          text: this.message,
          payload: requestBody.payload,
          timestamp: new Date().getTime(),
          synced: false,
        }
        this.$store.commit('addMessage', {
          chatId: this.chat.id,
          message: newMessage,
        })
        this.$store.commit('updateOwnKey', {
          chatId: this.chat.id,
          ownKey: OtpCrypto.encryptedDataConverter.bytesToBase64(this.otpCryptoResult.remainingKey),
        })
      } else {
        this.showToast(this.$t('syncingMessages'))
        if (this.lastOwnMessage == null) {
          this.showToast(this.$t('lastOwnMessageNotExistsError'))
          throw Error(this.$t('lastOwnMessageNotExistsError'))
        }
        if (this.lastOwnMessage.payload == null) {
          this.showToast(this.$t('postMessageSyncError'))
          throw Error(this.$t('postMessageSyncError'))
        }
        requestBody = {
          id: this.lastOwnMessage.id,
          sender: this.$store.state.id,
          receiver: this.chat.otherId,
          payload: this.lastOwnMessage.payload,
        }
      }
      try {
        const response = await this.$http.post('messages', requestBody, { timeout: 5000 })
        const { timestamp } = (response.data as ApiMessageResponseBody)
        if (this.lastOwnMessage == null) {
          this.showToast(`[Retry] ${this.$t('lastOwnMessageNotExistsError')}`)
          throw Error(`[Retry] ${this.$t('lastOwnMessageNotExistsError')}`)
        }
        this.$store.commit('syncSentMessage', {
          chatId: this.chat.id,
          messageId: this.lastOwnMessage.id,
          timestamp,
        })
        this.message = ''
      } catch (error) {
        const { response } = error as AxiosError
        if (response) {
          this.handleUnexpectedError((error as AxiosError))
        } else {
          this.showToast(this.$t('networkError'))
        }
      } finally {
        this.isSendingMessage = false
      }
    },
    async showDeleteAllMessagesDialog() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('deleteAllMessagesLocallyTitle'),
        buttons: [
          {
            text: this.$t('deleteAllMessagesLocally'),
            role: 'destructive',
            handler: () => {
              this.$store.commit('deleteAllMessages', this.chat.id)
            },
          },
          {
            text: this.$t('cancel'),
            role: 'cancel',
          },
        ],
      })
      await actionSheet.present()
    },
    async showInformationDialog() {
      const inputs = [
        {
          value: this.chat.name,
          placeholder: this.$t('chatNamePlaceholder'),
          attributes: { autocapitalize: 'on' },
        },
      ]
      const buttons = [
        {
          text: this.$t('saveChatName'),
          role: 'confirm',
          handler: (value: any): boolean => {
            const name = value[0]
            if (name.trim() === '') {
              this.showToast(this.$t('enterChatNameMessage'))
              return false
            }
            this.$store.commit('setChatName', {
              chatId: this.chat.id,
              name,
            })
            return true
          },
        },
        {
          text: this.$t('refillKey'),
          handler: () => {
            this.refillKey()
          },
        },
        {
          text: this.$t('deleteChatHistory'),
          role: 'destrutive',
          handler: () => {
            this.showDeleteAllMessagesDialog()
          },
        },
        {
          text: this.$t('cancel'),
          role: 'cancel',
        },
      ]
      await (await alertController.create({
        header: this.$t('chat'),
        subHeader: `${this.$t('ownKey')}: ${this.ownKey.length} ${this.$t('bytes')}`,
        message: `${this.$t('otherKey')}: ${this.otherKey.length} ${this.$t('bytes')}`,
        inputs,
        buttons,
      })).present()
    },
    async showDeleteMessageDialog(messageId: string, headerText: string) {
      const actionSheet = await actionSheetController.create({
        header: headerText.substring(0, 100),
        buttons: [
          {
            text: this.$t('deleteMessageLocally'),
            role: 'destructive',
            handler: () => {
              this.$store.commit('deleteMessage', {
                chatId: this.chat.id,
                messageId,
              })
            },
          },
          {
            text: this.$t('cancel'),
            role: 'cancel',
            handler: () => {
              const { messagesList } = this.$refs as any
              messagesList?.$el?.closeSlidingItems()
            },
          },
        ],
      })
      await actionSheet.present()
    },
    scrollToBottom() {
      const { content } = this.$refs as any
      content?.$el?.scrollToBottom(0)
    },
    dateTimeText(timestamp: number) {
      const humanDate = this.humanizeDate(timestamp)
      return humanDate.isToday ? humanDate.timeText : `${humanDate.dateText}, ${humanDate.timeText}`
    },
    calculateByteArrayChecksum(bytes: Uint8Array) {
      let checksum = 0
      bytes.forEach(byte => { checksum ^= byte })
      return checksum
    },
  },
})
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
