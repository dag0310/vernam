<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button router-link="/settings" :aria-label="t('settings')">
            <ion-icon slot="icon-only" :icon="ionIconCog" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ t('chats') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showCreateChatDialog()" :aria-label="t('newChat')">
            <ion-icon slot="icon-only" :icon="ionIconAdd" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar v-show="searchText.length > 0 || filteredChats.length > 0">
        <ion-searchbar v-model="searchText" :placeholder="t('searchbarPlaceholder')" />
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>
      <div v-show="showPushNotificationsElements" class="ion-margin-top ion-margin-bottom">
        <div v-if="serviceWorkerRegistration != null && notificationPermission === 'default'" style="position: relative;">
          <span @click="store.showEnablePushNotifications = false" :disabled="!pushNotificationButtonEnabled" style="position: absolute; top: -20px; right: 0; padding: 5px; cursor: pointer;">&times;</span>
          <ion-button @click="enablePushNotifications()" class="ion-margin-horizontal" expand="block">
            {{ t('enablePushNotifications') }}
          </ion-button>
        </div>
        <ion-card v-if="serviceWorkerRegistration == null || notificationPermission == null" color="warning">
          <span @click="store.showEnablePushNotifications = false" style="position: absolute; top: 5px; right: 9px; z-index: 1; cursor: pointer;">&times;</span>
          <ion-card-content>
            <h1>{{ t('attention') }}</h1>
            <span>{{ t('notificationPermissionNotSupported') }}</span> <span v-html="buildNotificationPermissionNotSupportedMessage()" />
          </ion-card-content>
        </ion-card>
      </div>
      <ion-button @click="showCreateChatDialog()" v-show="searchText.length <= 0 && filteredChats.length <= 0 && !showPushNotificationsElements" expand="block" class="ion-margin-horizontal ion-margin-top">{{ t('newChat') }}</ion-button>
      <ion-list v-show="filteredChats.length > 0" ref="chatsList">
        <ion-item-sliding v-for="chat in filteredChats" :key="chat.id">
          <ion-item @click="goToChatPage(chat)" lines="inset" :button="true" :detail="false">
            <div v-if="chat.hasNewMessage" class="unread-indicator-wrapper" slot="start">
              <div class="unread-indicator" />
            </div>
            <ion-label>
              <strong class="ion-text-nowrap">{{ chat.name }}</strong>
              <ion-note color="medium" class="ion-text-nowrap">
                <template v-if="chat.message.trim().length > 0"><i>{{ t('draft') }}: </i>{{ chat.message }}</template>
                <template v-else-if="getLastMessage(chat)">
                  <i v-if="getLastMessage(chat)?.own">{{ t('you') }}: </i>{{ getLastMessage(chat)?.text.trim() }}
                </template>
                <template v-else>
                  <i>{{ t('noMessagesPreviewText') }}</i>
                </template>
              </ion-note>
            </ion-label>
            <div class="metadata-end-wrapper" slot="end">
              <ion-note color="medium">{{ lastMessageDateText(chat) }}</ion-note>
            </div>
          </ion-item>
          <ion-item-options @ion-swipe="setHasNewMessage(chat, !chat.hasNewMessage)" side="start">
            <ion-item-option @click="setHasNewMessage(chat, !chat.hasNewMessage)" color="primary" expandable>
              <ion-icon slot="top" :icon="chat.hasNewMessage ? ionIconMail : ionIconMailUnread" />
              {{ chat.hasNewMessage ? t('read') : t('unread') }}
            </ion-item-option>
          </ion-item-options>
          <ion-item-options @ion-swipe="showDeleteChatDialog(chat)" side="end">
            <ion-item-option @click="showDeleteChatDialog(chat)" color="danger" expandable>
              <ion-icon slot="top" :icon="ionIconTrash" />
              {{ t('delete') }}
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div class="ion-padding info-text" v-show="filteredChats.length <= 0 && searchText.length > 0">{{ t('noChatsFound') }}</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonSearchbar, IonButtons, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonList, IonItemSliding, IonItem, IonLabel, IonNote, IonItemOptions, IonItemOption, IonButton, IonIcon, IonCard, IonCardContent, actionSheetController, alertController, onIonViewDidEnter } from '@ionic/vue'
import { cog as ionIconCog, add as ionIconAdd, mailUnread as ionIconMailUnread, mail as ionIconMail, trash as ionIconTrash } from 'ionicons/icons'
import { computed, inject, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AxiosError } from 'axios'
import { v4 as uuidv4 } from 'uuid'

import { Chat, Message } from '../types'
import { buildNotificationPermissionNotSupportedMessage, handleUnexpectedError, humanizeDate, isMessageVisible, showToast } from '../mixin'
import useStore from '../store'
import useGlobalStore from '../global'

const store = useStore()
const global = useGlobalStore()
const router = useRouter()
const { t } = useI18n()
const chatsListRef = useTemplateRef('chatsList')
const axios: any = inject('axios')

const searchText = ref('')
const pushNotificationButtonEnabled = ref(true)
const notificationPermission = ref(('Notification' in window) ? Notification.permission : null)
const serviceWorkerRegistration = ref(('serviceWorker' in navigator) ? navigator.serviceWorker.register('/js/serviceworker.js?t=1706877454') : null)

onMounted(() => {
  global.pollingActive = true
  onIonViewDidEnter(() => {
    global.pollingActive = true
    global.currentChatId = null
    notificationPermission.value = ('Notification' in window) ? Notification.permission : null
  })
})

const showPushNotificationsElements = computed(() => store.showEnablePushNotifications && store.id != null && notificationPermission.value !== 'granted' && notificationPermission.value !== 'denied')

function getLastMessage(chat: Chat): Message | null {
  const chatMessages = chat.messages
    .filter(message => isMessageVisible(message))
    .sort((messageA, messageB) => messageB.timestamp - messageA.timestamp)
  return (chatMessages.length > 0) ? chatMessages[0] : null
}

const filteredChats = computed(() => store.chats
  .filter(chat => chat.name.toUpperCase().includes(searchText.value.toUpperCase()))
  .sort((chatA, chatB) => {
    if (chatA.message && !chatB.message) {
      return -1
    }
    if (!chatA.message && chatB.message) {
      return 1
    }
    const lastMessageChatA = getLastMessage(chatA)
    const lastMessageChatB = getLastMessage(chatB)
    const timestampA = lastMessageChatA?.timestamp ?? chatA.timestamp ?? 0
    const timestampB = lastMessageChatB?.timestamp ?? chatB.timestamp ?? 0
    return timestampB - timestampA
  }))

function refresh(ev: CustomEvent): void {
  setTimeout(() => {
    ev.detail.complete()
    window.location.reload()
  }, 500)
}

function lastMessageDateText(chat: Chat): string {
  const lastMessage = getLastMessage(chat)
  if (lastMessage == null) {
    return ''
  }
  const dateStr = humanizeDate(lastMessage.timestamp)
  return dateStr.isToday ? dateStr.timeText : dateStr.dateText
}

function goToChatPage(chat: Chat): void {
  store.setHasNewMessage(chat.id, false)
  global.currentChatId = chat.id
  router.push('/chat')
}

async function showCreateChatDialog(): Promise<void> {
  const inputs = [
    {
      placeholder: t('chatNamePlaceholder'),
      attributes: { autocapitalize: 'on' },
    },
  ]
  const buttons = [
    {
      text: t('cancel'),
      role: 'cancel',
    },
    {
      text: t('newChatConfirm'),
      role: 'confirm',
      handler: (value: any): boolean => {
        const name = value[0]
        if (name.trim() === '') {
          showToast(t('enterChatNameMessage'))
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
        store.chats.push(newChat)
        global.currentChatId = newChat.id
        router.push('/chat')
        return true
      },
    },
  ]
  await (await alertController.create({
    header: t('newChat'),
    subHeader: t('newChatSubHeader'),
    inputs,
    buttons,
  })).present()
}

function setHasNewMessage(chat: Chat, hasNewMessage: boolean): void {
  store.setHasNewMessage(chat.id, hasNewMessage);
  (chatsListRef.value as any)?.$el.closeSlidingItems()
}

async function showDeleteChatDialog(chat: Chat): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: chat.name,
    buttons: [
      {
        text: t('deleteChatLocally'),
        role: 'destructive',
        handler: (): void => {
          store.deleteChat(chat.id)
        },
      },
      {
        text: t('cancel'),
        role: 'cancel',
        handler: (): void => {
          (chatsListRef.value as any)?.$el.closeSlidingItems()
        },
      },
    ],
  })
  await actionSheet.present()
}

async function enablePushNotifications(): Promise<void> {
  pushNotificationButtonEnabled.value = false
  let vapidPublicKeyResponse
  try {
    vapidPublicKeyResponse = await axios.get('push-key', { timeout: 5000 })
  } catch (error) {
    const { response } = error as AxiosError
    if (response) {
      handleUnexpectedError((error as AxiosError))
    } else {
      showToast(t('networkError'))
    }
    pushNotificationButtonEnabled.value = true
    return
  }
  const vapidPublicKey = (vapidPublicKeyResponse.data != null) ? vapidPublicKeyResponse.data.vapidPublicKey : null
  if (vapidPublicKey == null) {
    showToast(t('vapidPublicKeyNotInResponse'))
    pushNotificationButtonEnabled.value = true
    return
  }

  const localServiceWorkerRegistration = await serviceWorkerRegistration.value
  if (localServiceWorkerRegistration == null) {
    pushNotificationButtonEnabled.value = true
    return
  }
  notificationPermission.value = await Notification.requestPermission()

  if (notificationPermission.value !== 'granted') {
    pushNotificationButtonEnabled.value = true
    return
  }
  const pushSubscription = await localServiceWorkerRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey,
  })

  try {
    await axios.post('push-subscription', { receiver: store.id, endpoint: pushSubscription.endpoint }, { timeout: 5000 })
    showToast(t('pushNotificationSubscriptionSuccessMessage'))
  } catch (error) {
    const { response } = error as AxiosError
    if (response) {
      switch (response.status) {
        case 409:
          showToast(t('pushNotificationSubscriptionDuplicateErrorMessage'))
          break
        default:
          handleUnexpectedError((error as AxiosError))
      }
    } else {
      showToast(t('networkError'))
    }
  } finally {
    pushNotificationButtonEnabled.value = true
  }
}
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
