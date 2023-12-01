<template>
  <v-ons-page id="home">
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="showSettingsPage" :aria-label="$t('settings')">
          <v-ons-icon icon="ion-ios-cog, material:ion-md-cog"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">{{ $t('chats') }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="showCreateChatDialog = true" :aria-label="$t('newChat')">
          <v-ons-icon icon="ion-ios-add, material:ion-md-add"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content">
      <p class="marginalizedContent" v-show="showEnablePushNotifications && $store.state.id != null && notificationPermission !== 'granted' && notificationPermission !== 'denied'">
        <span class="notification" @click="showEnablePushNotifications = false">&times;</span>
        <v-ons-button v-if="serviceWorkerRegistration != null && notificationPermission === 'default'" modifier="large" @click="enablePushNotifications()" :disabled="!pushNotificationButtonEnabled">{{ $t('enablePushNotifications') }}</v-ons-button>
        <v-ons-card v-if="serviceWorkerRegistration == null || notificationPermission == null ">
          {{ $t('notificationPermissionNotSupported') }}
          <span v-if="isIos" v-html="$t('notificationPermissionNotSupportedIos')"></span>
          <span v-if="isAndroid" v-html="$t('notificationPermissionNotSupportedAndroid')"></span>
        </v-ons-card>
      </p>
      <p class="marginalizedContent" v-if="searchText.length <= 0 && filteredChats.length <= 0">
        <v-ons-button modifier="large" @click="showCreateChatDialog = true" :aria-label="$t('newChat')">{{ $t('newChat') }}</v-ons-button>
      </p>
      <p class="searchContainer marginalizedContent" v-show="searchText.length > 0 || filteredChats.length > 0">
        <v-ons-search-input :placeholder="$t('searchbarPlaceholder')" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0"><v-ons-icon icon="ion-ios-close, material:ion-md-close"></v-ons-icon></span>
      </p>
      <v-ons-list v-show="filteredChats.length > 0">
        <v-ons-list-item v-for="chat in filteredChats" :key="chat.id" tappable @click="showChatPage(chat)">
          <div class="center">
            <span class="list-item__title ellipsis" :class="{bold: chat.newMessages}">{{ chat.name }}</span>
            <span class="list-item__subtitle ellipsis" :class="{bold: chat.newMessages}">
              <template v-if="chat.message.length > 0"><i>{{ $t('draft') }}: </i>{{ chat.message }}</template>
              <template v-else>
                <i v-if="lastMessageIsOwn(chat)">{{ $t('you') }}: </i>
                {{ lastMessageText(chat) }}
              </template>
            </span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ lastMessageDateText(chat) }}</span>
            <v-ons-icon icon="ion-ios-trash, material:ion-md-trash" class="list-item__icon" @click.stop="deleteChat(chat)" :aria-label="$t('deleteChatLocally')"></v-ons-icon>
            <v-ons-icon icon="ion-ios-arrow-forward, material:ion-md-arrow-forward" class="list-item__icon chevron"></v-ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredChats.length <= 0 && searchText.length > 0">{{ $t('noChatsFound') }}</div>
    </div>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="showCreateChatDialog">
      <span slot="title">{{ $t('newChat') }}</span>
      <p>
        <v-ons-input type="text" modifier="underbar" :placeholder="$t('chatNamePlaceholder')" float v-model="newChatName"></v-ons-input>
      </p>
      <template slot="footer">
        <div class="alert-dialog-button" @click="showCreateChatDialog = false; newChatName = '';">{{ $t('cancel') }}</div>
        <div class="alert-dialog-button" @click="createChat(newChatName);"><b>{{ $t('add') }}</b></div>
      </template>
    </v-ons-alert-dialog>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="showIntroDialog">
      <h3 style="margin-top: 0;">{{ $t('introTitle') }}</h3>
      <p v-html="$t('introText').replace(/\n/g, '<br>')"></p>
      <template slot="footer">
        <div class="alert-dialog-button" @click="showIntroDialog = false">{{ $t('readLater') }}</div>
        <div class="alert-dialog-button" @click="showIntroDialog = false"><b>{{ $t('alright') }}</b></div>
      </template>
    </v-ons-alert-dialog>
  </v-ons-page>
</template>

<script>
import Settings from './Settings'
import Chat from './Chat'

import { v4 as uuidv4 } from 'uuid'
import platform from 'platform-detect'

export default {
  name: 'home',
  data () {
    return {
      searchText: '',
      showIntroDialog: false,
      showCreateChatDialog: false,
      newChatName: '',
      pushNotificationButtonEnabled: true,
      notificationPermission: ('Notification' in window) ? Notification.permission : null,
      serviceWorkerRegistration: ('serviceWorker' in navigator) ? navigator.serviceWorker.register('/static/js/serviceworker.js?t=1701130409') : null,
    }
  },
  created () {
    if (this.$store.state.id == null) {
      this.$store.commit('setId', uuidv4())
      this.showIntroDialog = true
    }

    this.isIos = platform.ios
    this.isAndroid = platform.android

    document.addEventListener('show', event => {
      if (event.target.matches('#home')) {
        this.$store.commit('setCurrentChatId', null)
      }
    }, false)
  },
  computed: {
    showEnablePushNotifications: {
      get () {
        return this.$store.state.showEnablePushNotifications
      },
      set (value) {
        this.$store.commit('setShowEnablePushNotifications', value)
      }
    },
    chats () {
      return this.$store.state.chats
    },
    filteredChats () {
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
    }
  },
  methods: {
    async enablePushNotifications () {
      this.pushNotificationButtonEnabled = false
      let vapidPublicKeyResponse
      try {
        vapidPublicKeyResponse = await this.$http.get('push-key', { timeout: 5000 })
      } catch (error) {
        switch (error.status) {
          case 0:
            this.$ons.notification.toast(this.$t('networkError'), { timeout: 3000 })
            break
          case 500:
            this.$ons.notification.toast(this.$t('vapidPublicKeyNotSet'), { timeout: 3000 })
            break
          default:
            this.$ons.notification.toast(this.$t('unexpectedErrorWithCode', { code: error.status }), { timeout: 3000 })
            console.error(error)
        }
        this.pushNotificationButtonEnabled = true
        return
      }
      const vapidPublicKey = (vapidPublicKeyResponse.body != null) ? vapidPublicKeyResponse.body.vapidPublicKey : null
      if (vapidPublicKey == null) {
        this.$ons.notification.toast(this.$t('vapidPublicKeyNotInResponse'), { timeout: 3000 })
        this.pushNotificationButtonEnabled = true
        return
      }

      const serviceWorkerRegistration = await this.serviceWorkerRegistration
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
        this.$ons.notification.toast(this.$t('pushNotificationSubscriptionSuccessMessage'), { timeout: 3000 })
      } catch (error) {
        switch (error.status) {
          case 0:
            this.$ons.notification.toast(this.$t('networkError'), { timeout: 3000 })
            break
          case 409:
            this.$ons.notification.toast(this.$t('pushNotificationSubscriptionDuplicateErrorMessage'), { timeout: 3000 })
            break
          default:
            this.$ons.notification.toast(this.$t('unexpectedErrorWithCode', { code: error.status }), { timeout: 3000 })
            console.error(error)
        }
      } finally {
        this.pushNotificationButtonEnabled = true
      }
    },
    lastMessage (chat) {
      const messages = JSON.parse(JSON.stringify(chat.messages)) // Avoids infinite loop in render function
      return (messages.length > 0) ? messages.sort((a, b) => b.timestamp - a.timestamp)[0] : null
    },
    lastMessageText (chat) {
      const lastMessage = this.lastMessage(chat)
      return lastMessage ? lastMessage.text : ''
    },
    lastMessageIsOwn (chat) {
      const lastMessage = this.lastMessage(chat)
      return lastMessage ? lastMessage.own : false
    },
    lastMessageDateText (chat) {
      const lastMessage = this.lastMessage(chat)
      if (lastMessage !== null) {
        const humanDate = this.humanizeDate(lastMessage.timestamp)
        return humanDate.isToday ? humanDate.timeText : humanDate.dateText
      }
      return ''
    },
    showSettingsPage () {
      this.$emit('push-page', Settings)
    },
    showChatPage (chat) {
      this.$store.commit('setNewMessagesFalse', chat.id)
      this.$store.commit('setCurrentChatId', chat.id)
      this.$emit('push-page', Chat)
    },
    deleteChat (chat) {
      this.$ons.openActionSheet({ buttons: [this.$t('deleteChatLocally'), this.$t('cancel')], title: chat.name, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteChat', chat.id)
        }
      })
    },
    createChat (name) {
      if (name.trim() === '') {
        this.$ons.notification.toast(this.$t('enterChatNameMessage'), { timeout: 3000 })
        return
      }
      const newChatId = uuidv4()
      this.$store.commit('createChat', {
        id: newChatId,
        otherId: null,
        name: name,
        messages: [],
        message: '',
        newMessages: false,
        ownKey: '',
        otherKey: '',
      })
      this.$store.commit('setCurrentChatId', newChatId)
      this.$emit('push-page', Chat)
      this.showCreateChatDialog = false
      this.newChatName = ''
    }
  }
}
</script>

<style scoped>
  .notification {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(-50%, 50%);
    z-index: 1;
  }
  .list-item__title, .list-item__subtitle {
    width: 150px;
  }
  .list-item__label {
    font-size: 12px;
    overflow: visible;
    white-space: nowrap;
  }
  .list-item__icon {
    color: rgba(0, 0, 0, 0.5);
  }
  .list-item__icon.chevron {
    font-size: 20px;
    color: #c7c7cc;
  }
</style>
