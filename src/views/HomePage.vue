<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/settings" :aria-label="$t('settings')">
            <ion-icon slot="icon-only" :icon="ionIconCog"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ $t('chats') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showCreateChatDialog()" :aria-label="$t('newChat')">
            <ion-icon slot="icon-only" :icon="ionIconAdd"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-show="searchText.length > 0 || filteredChats.length > 0">
        <ion-searchbar v-model="searchText" :placeholder="$t('searchbarPlaceholder')"></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div v-show="showPushNotificationsElements" class="ion-margin-top ion-margin-bottom">
        <div v-if="serviceWorkerRegistration != null && notificationPermission === 'default'" style="position: relative;">
          <span @click="showEnablePushNotifications = false" :disabled="!pushNotificationButtonEnabled" style="position: absolute; top: -20px; right: 0; padding: 5px; cursor: pointer;">&times;</span>
          <ion-button @click="enablePushNotifications()" class="ion-margin-horizontal" expand="block">
            {{ $t('enablePushNotifications') }}
          </ion-button>
        </div>
        <ion-card v-if="serviceWorkerRegistration == null || notificationPermission == null" color="warning">
          <span @click="showEnablePushNotifications = false" style="position: absolute; top: 5px; right: 9px; z-index: 1; cursor: pointer;">&times;</span>
          <ion-card-content>
            <h1>{{ $t('attention') }}</h1>
            <span>{{ $t('notificationPermissionNotSupported') }}</span> <span v-html="buildNotificationPermissionNotSupportedMessage()"></span>
          </ion-card-content>
        </ion-card>
      </div>
      <ion-button @click="showCreateChatDialog()" v-show="searchText.length <= 0 && filteredChats.length <= 0 && !showPushNotificationsElements" expand="block" class="ion-margin-horizontal ion-margin-top">{{ $t('newChat') }}</ion-button>
      <ion-list v-show="filteredChats.length > 0" ref="chatsList">
        <ion-item-sliding v-for="chat in filteredChats" :key="chat.id">
          <ion-item @click="goToChatPage(chat)" lines="inset" :button="true" :detail="false">
            <div v-if="chat.hasNewMessage" class="unread-indicator-wrapper" slot="start">
              <div class="unread-indicator"></div>
            </div>
            <ion-label>
              <strong class="ion-text-nowrap">{{ chat.name }}</strong>
              <ion-note color="medium" class="ion-text-nowrap">
                <template v-if="chat.message.trim().length > 0"><i>{{ $t('draft') }}: </i>{{ chat.message }}</template>
                <template v-else-if="lastMessage(chat)">
                  <i v-if="lastMessage(chat)?.own">{{ $t('you') }}: </i>{{ lastMessage(chat)?.text.trim() }}
                </template>
                <template v-else>
                  <i>{{ $t('noMessagesPreviewText') }}</i>
                </template>
              </ion-note>
            </ion-label>
            <div class="metadata-end-wrapper" slot="end">
              <ion-note color="medium">{{ lastMessageDateText(chat) }}</ion-note>
            </div>
          </ion-item>
          <ion-item-options @ion-swipe="setHasNewMessage(chat, !chat.hasNewMessage)" side="start">
            <ion-item-option @click="setHasNewMessage(chat, !chat.hasNewMessage)" color="primary" expandable>
              <ion-icon slot="top" :icon="chat.hasNewMessage ? ionIconMail : ionIconMailUnread"></ion-icon>
              {{ chat.hasNewMessage ? $t('read') : $t('unread') }}
            </ion-item-option>
          </ion-item-options>
          <ion-item-options @ion-swipe="showDeleteChatDialog(chat)" side="end">
            <ion-item-option @click="showDeleteChatDialog(chat)" color="danger" expandable>
              <ion-icon slot="top" :icon="ionIconTrash"></ion-icon>
              {{ $t('delete') }}
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div class="ion-padding info-text" v-show="filteredChats.length <= 0 && searchText.length > 0">{{ $t('noChatsFound') }}</div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonItemSliding, IonItem, IonLabel, IonNote, IonItemOptions, IonItemOption, IonButton, IonIcon, IonCard, IonCardContent, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { cog as ionIconCog, add as ionIconAdd, close as ionIconClose, mailUnread as ionIconMailUnread, mail as ionIconMail, trash as ionIconTrash } from 'ionicons/icons'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { AxiosError } from 'axios'
import { v4 as uuidv4 } from 'uuid'

import mixin from '../mixin'
import { Chat } from '../types'

export default defineComponent({
  components: { IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonItemSliding, IonItem, IonLabel, IonNote, IonItemOptions, IonItemOption, IonButton, IonIcon, IonCard, IonCardContent },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  data(): {
    searchText: string,
    pushNotificationButtonEnabled: boolean,
    notificationPermission: NotificationPermission | null,
    serviceWorkerRegistration: Promise<ServiceWorkerRegistration> | null,
    ionIconCog: string,
    ionIconAdd: string,
    ionIconClose: string,
    ionIconMailUnread: string,
    ionIconMail: string,
    ionIconTrash: string,
  } {
    return {
      searchText: '',
      pushNotificationButtonEnabled: true,
      notificationPermission: ('Notification' in window) ? Notification.permission : null,
      serviceWorkerRegistration: ('serviceWorker' in navigator) ? navigator.serviceWorker.register('/js/serviceworker.js?t=1706877454') : null,
      ionIconCog,
      ionIconAdd,
      ionIconClose,
      ionIconMailUnread,
      ionIconMail,
      ionIconTrash,
    }
  },
  mounted() {
    if (this.$store.state.id == null) {
      this.$store.commit('setId', uuidv4())
      this.showIntroDialog()
    }
    this.$global.state.pollingActive = true
    onIonViewDidEnter(() => {
      this.$global.state.pollingActive = true
      this.$global.state.currentChatId = null
      this.notificationPermission = ('Notification' in window) ? Notification.permission : null
    })
  },
  computed: {
    showEnablePushNotifications: {
      get(): boolean {
        return this.$store.state.showEnablePushNotifications
      },
      set(value: boolean) {
        this.$store.commit('setShowEnablePushNotifications', value)
      },
    },
    showPushNotificationsElements() {
      return this.showEnablePushNotifications && this.$store.state.id != null && this.notificationPermission !== 'granted' && this.notificationPermission !== 'denied'
    },
    filteredChats() {
      return (this.$store.state.chats as Chat[])
        .filter(chat => chat.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((chatA, chatB) => {
          if (chatA.message && !chatB.message) {
            return -1
          }
          if (!chatA.message && chatB.message) {
            return 1
          }
          const lastMessageChatA = this.lastMessage(chatA)
          const lastMessageChatB = this.lastMessage(chatB)
          const timestampA = lastMessageChatA?.timestamp ?? chatA.timestamp ?? 0
          const timestampB = lastMessageChatB?.timestamp ?? chatB.timestamp ?? 0
          return timestampB - timestampA
        })
    },
  },
  methods: {
    refresh(ev: CustomEvent) {
      setTimeout(() => {
        ev.detail.complete()
        window.location.reload()
      }, 500)
    },
    lastMessage(chat: Chat) {
      const chatMessages = chat.messages
        .filter(message => this.isMessageVisible(message))
        .sort((messageA, messageB) => messageB.timestamp - messageA.timestamp)
      return (chatMessages.length > 0) ? chatMessages[0] : null
    },
    lastMessageDateText(chat: Chat) {
      const lastMessage = this.lastMessage(chat)
      if (lastMessage == null) {
        return ''
      }
      const dateStr = this.humanizeDate(lastMessage.timestamp)
      return dateStr.isToday ? dateStr.timeText : dateStr.dateText
    },
    goToChatPage(chat: Chat) {
      this.$store.commit('setHasNewMessage', {
        chatId: chat.id,
        hasNewMessage: false,
      })
      this.$global.state.currentChatId = chat.id
      this.$router.push('/chat')
    },
    async showCreateChatDialog() {
      const inputs = [
        {
          placeholder: this.$t('chatNamePlaceholder'),
          attributes: { autocapitalize: 'on' },
        },
      ]
      const buttons = [
        {
          text: this.$t('cancel'),
          role: 'cancel',
        },
        {
          text: this.$t('newChatConfirm'),
          role: 'confirm',
          handler: (value: any): boolean => {
            const name = value[0]
            if (name.trim() === '') {
              this.showToast(this.$t('enterChatNameMessage'))
              return false
            }
            const newChat: Chat = {
              id: uuidv4(),
              otherId: null,
              name,
              messages: [],
              message: '',
              hasNewMessage: false,
              ownKey: '',
              otherKey: '',
              timestamp: new Date().getTime(),
            }
            this.$store.commit('createChat', newChat)
            this.$global.state.currentChatId = newChat.id
            this.$router.push('/chat')
            return true
          },
        },
      ]
      await (await alertController.create({
        header: this.$t('newChat'),
        subHeader: this.$t('newChatSubHeader'),
        inputs,
        buttons,
      })).present()
    },
    setHasNewMessage(chat: Chat, hasNewMessage: boolean) {
      this.$store.commit('setHasNewMessage', {
        chatId: chat.id,
        hasNewMessage,
      })
      const { chatsList } = this.$refs as any
      chatsList?.$el?.closeSlidingItems()
    },
    async showDeleteChatDialog(chat: Chat) {
      const actionSheet = await actionSheetController.create({
        header: chat.name,
        buttons: [
          {
            text: this.$t('deleteChatLocally'),
            role: 'destructive',
            handler: () => {
              this.$store.commit('deleteChat', chat.id)
            },
          },
          {
            text: this.$t('cancel'),
            role: 'cancel',
            handler: () => {
              const { chatsList } = this.$refs as any
              chatsList?.$el?.closeSlidingItems()
            },
          },
        ],
      })
      await actionSheet.present()
    },
    async enablePushNotifications() {
      this.pushNotificationButtonEnabled = false
      let vapidPublicKeyResponse
      try {
        vapidPublicKeyResponse = await this.$http.get('push-key', { timeout: 5000 })
      } catch (error) {
        const { response } = error as AxiosError
        if (response) {
          this.handleUnexpectedError((error as AxiosError))
        } else {
          this.showToast(this.$t('networkError'))
        }
        this.pushNotificationButtonEnabled = true
        return
      }
      const vapidPublicKey = (vapidPublicKeyResponse.data != null) ? vapidPublicKeyResponse.data.vapidPublicKey : null
      if (vapidPublicKey == null) {
        this.showToast(this.$t('vapidPublicKeyNotInResponse'))
        this.pushNotificationButtonEnabled = true
        return
      }

      const serviceWorkerRegistration = await this.serviceWorkerRegistration
      if (serviceWorkerRegistration == null) {
        this.pushNotificationButtonEnabled = true
        return
      }
      this.notificationPermission = await Notification.requestPermission()

      if (this.notificationPermission !== 'granted') {
        this.pushNotificationButtonEnabled = true
        return
      }
      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      try {
        await this.$http.post('push-subscription', { receiver: this.$store.state.id, endpoint: pushSubscription.endpoint }, { timeout: 5000 })
        this.showToast(this.$t('pushNotificationSubscriptionSuccessMessage'))
      } catch (error) {
        const { response } = error as AxiosError
        if (response) {
          switch (response.status) {
            case 409:
              this.showToast(this.$t('pushNotificationSubscriptionDuplicateErrorMessage'))
              break
            default:
              this.handleUnexpectedError((error as AxiosError))
          }
        } else {
          this.showToast(this.$t('networkError'))
        }
      } finally {
        this.pushNotificationButtonEnabled = true
      }
    },
  },
})
</script>

<style scoped>
.unread-indicator {
  background: var(--ion-color-primary);
  width: 10px;
  height: 10px;
  border-radius: 100%;
  position: absolute;
  inset-inline-start: 12px;
  top: 12px;
}

.metadata-end-wrapper {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  display: flex;
  align-items: center;
}
.metadata-end-wrapper ion-note {
  font-size: 0.8rem;
}

ion-label strong,
ion-label ion-note {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
ion-label strong {
  max-width: calc(100% - 65px);
}
ion-label ion-note {
  font-size: 0.9rem;
  max-width: calc(100%);
}
</style>
