<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>{{ $t('back') }}</v-ons-back-button>
      </div>
      <div class="center">{{ $t('settings') }}</div>
    </v-ons-toolbar>
    <div class="content">
      <v-ons-list>
        <v-ons-list-header>{{ $t('id') }}</v-ons-list-header>
        <v-ons-list-item>
          <div class="center selectable">
            {{ $store.state.id }}
          </div>
        </v-ons-list-item>
        <v-ons-list-header>{{ $t('qrCodes') }}</v-ons-list-header>
        <v-ons-list-item>
          <div class="left">{{ $t('amount') }}:</div>
          <v-ons-input class="center" type="number" min="1" max="100" step="1" modifier="underbar" inputmode="numeric" v-model="numQrCodes"></v-ons-input>
          <div class="right">{{ $t('qrCodes') }}</div>
        </v-ons-list-item>
        <v-ons-list-item>
          <div class="left">{{ $t('dataPerQrCode') }}:</div>
          <v-ons-input class="center" type="number" min="100" max="500" step="50" modifier="underbar" inputmode="numeric" v-model="bytesPerQrCode"></v-ons-input>
          <div class="right">{{ $t('bytes') }}</div>
        </v-ons-list-item>
        <v-ons-list-item>
          <div class="center">{{ $t('totalKeyRefillData') }}:&nbsp;<strong>{{ numQrCodes * bytesPerQrCode }} Bytes</strong></div>
        </v-ons-list-item>
        <v-ons-list-header>{{ $t('pushNotifications') }}</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button v-if="notificationPermission === 'default'" modifier="large" @click="showAndGoToEnablePushNotificationsButton()">{{ $t('enablePushNotifications') }}</v-ons-button>
            <span v-else-if="notificationPermission === 'granted'" v-html="$t('pushNotificationsGrantedMessage')"></span>
            <span v-else-if="notificationPermission === 'denied'" v-html="$t('pushNotificationsDeniedMessage')"></span>
            <template v-else>
              {{ $t('notificationPermissionNotSupported') }}
              <span v-if="isIos" v-html="$t('notificationPermissionNotSupportedIos')"></span>
              <span v-else-if="isAndroid" v-html="$t('notificationPermissionNotSupportedAndroid')"></span>
              <span v-else v-html="$t('notificationPermissionNotSupportedOther')"></span>
            </template>
          </div>
        </v-ons-list-item>
        <v-ons-list-header>{{ $t('dangerZone') }}</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="resetData()" style="background-color: red;">{{ $t('resetLocalData') }}</v-ons-button>
          </div>
        </v-ons-list-item>
        <v-ons-list-header>{{ $t('about') }}</v-ons-list-header>
        <v-ons-list-item>
          <div class="center selectable">
            © 2018, 2023 Daniel Geymayer<br>
            {{ $t('version') }}: {{ buildTimestamp }}
          </div>
        </v-ons-list-item>
      </v-ons-list>
    </div>
  </v-ons-page>
</template>

<script>
import platform from 'platform-detect'

export default {
  name: 'settings',
  data () {
    return {
      // BUILD_TIMESTAMP will be injected during build process, not available during development, which is OK
      buildTimestamp: BUILD_TIMESTAMP, // eslint-disable-line
    }
  },
  created () {
    this.notificationPermission = ('Notification' in window) ? Notification.permission : null
    this.isIos = platform.ios
    this.isAndroid = platform.android
  },
  computed: {
    numQrCodes: {
      get () {
        return this.$store.state.numQrCodes
      },
      set (value) {
        this.$store.commit('setNumQrCodes', parseInt(value, 10))
      }
    },
    bytesPerQrCode: {
      get () {
        return this.$store.state.bytesPerQrCode
      },
      set (value) {
        this.$store.commit('setBytesPerQrCode', parseInt(value, 10))
      }
    },
    showEnablePushNotifications: {
      get () {
        return this.$store.state.showEnablePushNotifications
      },
      set (value) {
        this.$store.commit('setShowEnablePushNotifications', value)
      }
    },
  },
  methods: {
    showAndGoToEnablePushNotificationsButton () {
      this.showEnablePushNotifications = true
      this.$emit('pop-page')
    },
    resetData () {
      this.$ons.openActionSheet({ buttons: [this.$t('resetLocalData'), this.$t('cancel')], title: this.$t('resetLocalDataTitle'), cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          window.localStorage.clear()
          window.location.reload()
        }
      })
    }
  }
}
</script>

<style scoped>
.left, .right {
  white-space: nowrap;
}
</style>