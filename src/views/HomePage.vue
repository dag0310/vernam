<template>
  <ion-page>
    <ion-header>
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
    <ion-content>
      <div v-show="showEnablePushNotifications && $store.state.id != null && notificationPermission !== 'granted' && notificationPermission !== 'denied'" class="ion-margin-top ion-margin-bottom">
        <div v-if="serviceWorkerRegistration != null && notificationPermission === 'default'">
          <span @click="showEnablePushNotifications = false" :disabled="!pushNotificationButtonEnabled" style="position: absolute; top: 0; right: 0; padding: 5px;">&times;</span>
          <ion-button @click="enablePushNotifications()" class="ion-margin-horizontal" expand="block">
            {{ $t('enablePushNotifications') }}
          </ion-button>
        </div>
        <ion-card v-if="serviceWorkerRegistration == null || notificationPermission == null">
          <span @click="showEnablePushNotifications = false" style="position: absolute; top: 5px; right: 9px; z-index: 1;">&times;</span>
          <ion-card-content>
            {{ $t('notificationPermissionNotSupported') }}
            <span v-html="buildNotificationPermissionNotSupportedMessage()"></span>
          </ion-card-content>
        </ion-card>
      </div>
      <ion-button @click="showCreateChatDialog()" v-show="searchText.length <= 0 && filteredChats.length <= 0" expand="block" class="ion-margin-horizontal ion-margin-top" :aria-label="$t('newChat')">{{ $t('newChat') }}</ion-button>
      <ion-list v-show="filteredChats.length > 0">
        <ion-item-sliding v-for="chat in filteredChats" :key="chat.id">
          <ion-item @click="goToChatPage(chat)" lines="inset" :button="true" :detail="false">
            <div v-if="chat.hasNewMessage" class="unread-indicator-wrapper" slot="start">
              <div class="unread-indicator"></div>
            </div>
            <ion-label>
              <strong class="ion-text-nowrap">{{ chat.name }}</strong>
              <ion-note color="medium" class="ion-text-nowrap" :style="{ 'font-weight': chat.hasNewMessage ? 'bold' : 'normal' }">
                <template v-if="chat.message.trim().length > 0"><i>{{ $t('draft') }}: </i>{{ chat.message }}</template>
                <template v-else>
                  <i v-if="lastMessageIsOwn(chat)">{{ $t('you') }}: </i>
                  {{ lastMessageText(chat) }}
                </template>
              </ion-note>
            </ion-label>
            <div class="metadata-end-wrapper" slot="end">
              <ion-note color="medium">{{ lastMessageDateText(chat) }}</ion-note>
            </div>
          </ion-item>
          <ion-item-options @ion-swipe="deleteChat(chat.id)" side="end">
            <ion-item-option @click="deleteChat(chat.id)" color="danger" expandable>
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
import { IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonTitle, IonContent, IonList, IonItemSliding, IonItem, IonLabel, IonNote, IonItemOptions, IonItemOption, IonButton, IonIcon, IonCard, IonCardContent, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { cog as ionIconCog, add as ionIconAdd, close as ionIconClose, trash as ionIconTrash } from 'ionicons/icons'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { AxiosError } from 'axios'
import { v4 as uuidv4 } from 'uuid'

import mixin from '../mixin'
import { Chat } from '../types'

export default defineComponent({
  components: { IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonTitle, IonContent, IonList, IonItemSliding, IonItem, IonLabel, IonNote, IonItemOptions, IonItemOption, IonButton, IonIcon, IonCard, IonCardContent },
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
    ionIconTrash: string,
  } {
    return {
      searchText: '',
      pushNotificationButtonEnabled: true,
      notificationPermission: ('Notification' in window) ? Notification.permission : null,
      serviceWorkerRegistration: ('serviceWorker' in navigator) ? navigator.serviceWorker.register('/js/serviceworker.js?t=1701130409') : null,
      ionIconCog,
      ionIconAdd,
      ionIconClose,
      ionIconTrash,
    }
  },
  mounted() {
    if (this.$store.state.id == null) {
      this.$store.commit('setId', uuidv4())
      this.showIntroDialog()
    }
    onIonViewDidEnter(() => {
      this.$store.commit('setCurrentChatId', null)
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
    chats() {
      return this.$store.state.chats as Chat[]
    },
    filteredChats() {
      return this.chats
        .filter(chat => chat.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => {
          const lastMessageA = this.lastMessage(a)
          const lastMessageB = this.lastMessage(b)
          if (!lastMessageA && !lastMessageB) {
            return 0
          }
          if (!lastMessageA) {
            return 1
          }
          if (!lastMessageB) {
            return -1
          }
          return lastMessageB.timestamp - lastMessageA.timestamp
        })
    },
  },
  methods: {
    lastMessage(chat: Chat) {
      return (chat.messages.length > 0) ? chat.messages.slice().sort((a, b) => b.timestamp - a.timestamp)[0] : null
    },
    lastMessageText(chat: Chat) {
      return this.lastMessage(chat)?.text?.trim() ?? ''
    },
    lastMessageIsOwn(chat: Chat) {
      return this.lastMessage(chat)?.own ?? false
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
      this.$store.commit('setCurrentChatId', chat.id)
      this.$router.push('/chat')
    },
    async showCreateChatDialog() {
      const inputs = [
        {
          placeholder: this.$t('chatNamePlaceholder'),
        },
      ]
      const buttons = [
        {
          text: this.$t('cancel'),
          role: 'cancel',
        },
        {
          text: this.$t('add'),
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
            }
            this.$store.commit('createChat', newChat)
            this.$store.commit('setCurrentChatId', newChat.id)
            this.$router.push('/chat')
            return true
          },
        },
      ]
      await (await alertController.create({
        header: this.$t('newChat'),
        inputs,
        buttons,
      })).present()
    },
    deleteChat(chatId: string) {
      this.$store.commit('deleteChat', chatId)
    },
    async showDeleteChatDialog(chat: Chat) {
      const actionSheet = await actionSheetController.create({
        header: chat.name,
        buttons: [
          {
            text: this.$t('deleteChatLocally'),
            role: 'destructive',
            handler: () => {
              this.deleteChat(chat.id)
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
    async enablePushNotifications() {
      this.pushNotificationButtonEnabled = false
      let vapidPublicKeyResponse
      try {
        vapidPublicKeyResponse = await this.$http.get('push-key', { timeout: 5000 })
      } catch (error) {
        if (this.$http.isAxiosError(error)) {
          this.showToast(this.$t('networkError'))
        } else {
          this.handleUnexpectedError((error as AxiosError))
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
        if (this.$http.isAxiosError(error)) {
          this.showToast(this.$t('networkError'))
        } else {
          switch ((error as AxiosError).status) {
            case 409:
              this.showToast(this.$t('pushNotificationSubscriptionDuplicateErrorMessage'))
              break
            default:
              this.handleUnexpectedError((error as AxiosError))
          }
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
