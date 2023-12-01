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
        <v-ons-list-header>{{ $t('showQrCodes') }}</v-ons-list-header>
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
              <span v-html="buildNotificationPermissionNotSupportedMessage()"></span>
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
          <div class="center selectable" @click="showHiddenOptions()">
            © 2018-2023 Daniel Geymayer<br>
            {{ $t('lastTimestamp') }}: {{ $store.state.lastTimestamp || $t('unknown') }}<br>
            {{ $t('version') }}: {{ buildTimestamp }}
          </div>
        </v-ons-list-item>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="showIntroDialog = true" style="background-color: gray;">{{ $t('introTitle') }}</v-ons-button>
          </div>
        </v-ons-list-item>
      </v-ons-list>
    </div>
    <v-ons-alert-dialog cancelable modifier="rowfooter" :visible.sync="showIntroDialog">
      <h3 style="margin-top: 0;">{{ $t('introTitle') }}</h3>
      <p v-html="$t('introText').replace(/\n/g, '<br>')"></p>
      <template slot="footer">
        <div class="alert-dialog-button" @click="showIntroDialog = false"><b>{{ $t('alright') }}</b></div>
      </template>
    </v-ons-alert-dialog>
  </v-ons-page>
</template>

<script>
export default {
  name: 'settings',
  data () {
    return {
      showIntroDialog: false,
      // BUILD_TIMESTAMP will be injected during build process, not available during development, which is OK
      buildTimestamp: BUILD_TIMESTAMP, // eslint-disable-line
    }
  },
  created () {
    this.notificationPermission = ('Notification' in window) ? Notification.permission : null
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
          window.location.reload(true)
        }
      })
    },
    showHiddenOptions () {
      this.$ons.openActionSheet({ buttons: [this.$t('reloadApp'), this.$t('resetLastTimestamp'), this.$t('cancel')], title: '', cancelable: true, destructive: 0 }).then(response => {
        switch (response) {
          case 0:
            window.location.reload(true)
            break
          case 1:
            this.$store.commit('setLastTimestamp', null)
            break
        }
      })
    },
  }
}
</script>

<style scoped>
.left, .right {
  white-space: nowrap;
}
</style>