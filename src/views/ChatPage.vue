<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="$t('back')"></ion-back-button>
        </ion-buttons>
        <ion-title @click="showInformationDialog()" style="cursor: pointer">{{ chat.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refillKey()">
            <span v-if="keyEmpty">{{ $t('refill') }}</span>
            <span v-else :style="{ color: (otpCryptoResult.bytesLeft < 0) ? 'var(--ion-color-danger)' : 'inherit' }">🔑 {{ otpCryptoResult.isKeyLongEnough ? otpCryptoResultWithoutPreamble.remainingKey.length : otpCryptoResult.bytesLeft }}</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-show="searchText.length > 0 || filteredMessages.length > 0">
        <ion-searchbar v-model="searchText" :placeholder="$t('searchbarPlaceholder')"></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content ref="content" class="ion-padding-bottom">
      <ion-list v-show="filteredMessages.length > 0" class="ion-margin-top" lines="none" :detail="false">
        <ion-item-sliding v-for="message in filteredMessages" :key="message.id">
          <ion-item>
            <ion-card :color="message.own ? 'primary' : 'light'" :slot="message.own ? 'end' : ''">
              <ion-card-content style="display: flex; flex-direction: row; flex-wrap: wrap; row-gap: 3px; column-gap: 10px;">
                <div v-html="message.html" style="user-select: text; overflow-wrap: anywhere; white-space: pre-wrap;"></div>
                <div class="time ion-text-nowrap">{{ dateTimeText(message.timestamp) }}</div>
              </ion-card-content>
            </ion-card>
          </ion-item>
          <ion-item-options @ion-swipe="deleteMessage(message.id)" side="end">
            <ion-item-option @click="deleteMessage(message.id)" color="danger" expandable>
              <ion-icon slot="top" :icon="ionIconTrash"></ion-icon>
              {{ $t('delete') }}
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div class="ion-padding-horizontal" style="display: flex; flex-direction: column; flex-wrap: nowrap; gap: 1rem;">
        <div class="ion-margin-top info-text" v-if="filteredMessages.length <= 0 && searchText.length > 0">{{ $t('noMessagesFoundMessage') }}</div>
        <div class="ion-margin-top info-text" v-if="chat.otherId == null && !keyEmpty">{{ $t('noOtherIdMessage') }}</div>
        <div class="ion-margin-top" style="text-align: center;" v-if="keyAlmostEmpty">
          <div class="info-text">
            <span v-if="keyEmpty">{{ $t('keyEmptyMessage') }}</span>
            <span v-else>{{ $t('keyAlmostEmptyMessage') }}</span>
            &ndash;<br>
            {{ $t('refillKeyMessage') }}
          </div>
          <ion-button @click="refillKey()" class="ion-margin-top">{{ $t('refill') }} 🔑</ion-button>
        </div>
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <ion-row class="ion-justify-content-between">
          <ion-col size="9">
            <ion-textarea v-model="message" :auto-grow="true" :disabled="!lastOwnMessageSynced" autocomplete="off" wrap="soft" :rows="1" mode="md" fill="outline"></ion-textarea>
          </ion-col>
          <ion-col size="3" class="ion-align-self-center">
            <ion-button @click="sendMessage()" :disabled="(isSendingMessage || !chat.otherId) || (lastOwnMessageSynced && (message.trim().length <= 0 || !otpCryptoResult.isKeyLongEnough))" fill="clear">{{ $t('send') }}</ion-button>
          </ion-col>
        </ion-row>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonFooter, IonToolbar, IonRow, IonCol, IonIcon, IonSearchbar, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardContent, IonButtons, IonBackButton, IonTitle, IonContent, IonTextarea, IonButton, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { close as ionIconClose, trash as ionIconTrash, create as ionIconCreate } from 'ionicons/icons'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { AxiosError } from 'axios'

import { v4 as uuidv4 } from 'uuid'
import OtpCrypto from 'otp-crypto'

import mixin from '../mixin'
import { ApiMessageRequestBody, ApiMessageResponseBody, Chat, FilteredMessage, Message } from '../types'

const keyAlmostEmptyThreshold = 100
const scrollToBottomTimeoutInMs = 500 // Small timeout necessary, otherwise much less reliable to update

export default defineComponent({
  components: { IonPage, IonHeader, IonFooter, IonToolbar, IonRow, IonCol, IonIcon, IonSearchbar, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardContent, IonButtons, IonBackButton, IonTitle, IonContent, IonTextarea, IonButton },
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
  } {
    return {
      searchText: '',
      isSendingMessage: false,
      ionIconClose,
      ionIconTrash,
      ionIconCreate,
    }
  },
  mounted() {
    this.scrollToBottom()
    onIonViewDidEnter(() => {
      this.scrollToBottom()
    })
    // DEBUGGING
    // this.$global.state.debugString = JSON.stringify(JSON.parse(localStorage.vuex))
  },
  watch: {
    lastMessage: {
      async handler() {
        setTimeout(() => { this.scrollToBottom() }, scrollToBottomTimeoutInMs)
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
  },
  computed: {
    chat(): Chat {
      return this.$store.getters.currentChat
    },
    message: {
      get() {
        return this.$store.getters.currentChat.message
      },
      set(value: string) {
        this.$store.commit('updateMessage', {
          chatId: this.chat.id,
          message: value,
        })
      },
    },
    filteredMessages(): FilteredMessage[] {
      return this.chat.messages
        .filter(message => message.text.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
        .map(message => {
          const tempDiv = document.createElement('div')
          tempDiv.appendChild(document.createTextNode(message.text))
          return {
            id: message.id,
            own: message.own,
            html: tempDiv.innerHTML.trim().replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: inherit;">$1</a>'),
            timestamp: message.timestamp,
          }
        })
    },
    lastMessage() {
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
    keyEmpty() {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.ownKey).remainingKey.length <= 0
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
        header: this.$t('whatIsYourPart'),
        buttons: [
          {
            text: this.$t('iShowTheQrCodes'),
            handler: () => {
              this.$router.push('/show')
            },
          },
          {
            text: this.$t('iScanTheQrCodes'),
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
        if (this.$http.isAxiosError(error)) {
          this.showToast(this.$t('networkError'))
        } else {
          this.handleUnexpectedError((error as AxiosError))
        }
      } finally {
        this.isSendingMessage = false
      }
    },
    async deleteAllMessages() {
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
          placeholder: this.$t('chatNamePlaceholder'),
          value: this.chat.name,
        },
      ]
      const buttons = [
        {
          text: this.$t('save'),
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
          text: this.$t('deleteChatHistory'),
          role: 'destrutive',
          handler: () => {
            this.deleteAllMessages()
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
    deleteMessage(messageId: string) {
      this.$store.commit('deleteMessage', {
        chatId: this.chat.id,
        messageId,
      })
    },
    async showDeleteMessageDialog(message: Message) {
      const actionSheet = await actionSheetController.create({
        header: message.text,
        buttons: [
          {
            text: this.$t('deleteMessageLocally'),
            role: 'destructive',
            handler: () => {
              this.deleteMessage(message.id)
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
  --background: var(--ion-color-light);
  --padding-top: var(--message-padding);
  --padding-bottom: var(--message-padding);
}
.textarea-fill-outline {
  --padding-start: var(--message-padding);
  --padding-end: var(--message-padding);
}
</style>