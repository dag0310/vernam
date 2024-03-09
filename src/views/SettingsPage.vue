<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="$t('back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ $t('settings') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- PUSH NOTIFICATIONS -->
      <h2>{{ $t('pushNotifications') }}</h2>
      <ion-button @click="showAndGoToEnablePushNotificationsButton()" v-if="notificationPermission === 'default'" expand="block">{{ $t('enablePushNotifications') }}</ion-button>
      <span v-else-if="notificationPermission === 'granted'" v-html="$t('pushNotificationsGrantedMessage')"></span>
      <span v-else-if="notificationPermission === 'denied'" v-html="$t('pushNotificationsDeniedMessage')"></span>
      <template v-else>
        {{ $t('notificationPermissionNotSupported') }}
        <span v-html="buildNotificationPermissionNotSupportedMessage()"></span>
      </template>
      <!-- SHOW QR CODES -->
      <h2>{{ $t('showQrCodes') }}</h2>
      <ion-input @ionChange="changeNumericSetting($event, 'setNumQrCodes',     1,   60)" v-model="numQrCodes"     :label="$t('amount')"        label-placement="start" type="number" step="1"  inputmode="numeric" autocomplete="off" required></ion-input>
      <ion-input @ionChange="changeNumericSetting($event, 'setBytesPerQrCode', 1, 1000)" v-model="bytesPerQrCode" :label="$t('dataPerQrCode')" label-placement="start" type="number" step="50" inputmode="numeric" autocomplete="off" required></ion-input>
      <ion-input :label="$t('totalKeyRefillData')" label-placement="start" readonly :value="totalKeySize + ' ' + $t('bytes')"></ion-input>
      <ion-button @click="restoreQrCodeDefaults()" v-show="numQrCodes !== defaultNumQrCodes || bytesPerQrCode !== defaultBytesPerQrCode" size="small" color="light" class="ion-margin-top">{{ $t('restoreDefaults') }}</ion-button>
      <!-- ABOUT -->
      <h2 @click="showDebugActions()">{{ $t('about') }}</h2>
      <div v-if="$global.state.debugMode" style="user-select: text; font-size: 0.9rem;">
        <p>{{ $t('id') }}: {{ $store.state.id }}</p>
        <p>{{ $t('lastTimestamp') }}: {{ lastTimestamp }}</p>
        <p>{{ $t('version') }}: {{ buildTimestamp }}</p>
        <p><textarea v-if="$global.state.debugString.length > 0 || true" v-model="$global.state.debugString" style="width: 100%; height: 50px;"></textarea></p>
      </div>
      <ion-button @click="showIntroDialog()" expand="block" color="dark">{{ $t('introTitle') }}</ion-button>
      <!-- DATA -->
      <h2>{{ $t('dataSectionHeader') }}</h2>
      <ion-button @click="exportData()" expand="block" color="dark">{{ $t('exportLocalData') }}</ion-button>
      <ion-button @click="importData()" expand="block" color="dark">{{ $t('importLocalData') }}</ion-button>
      <ion-button @click="resetData()" expand="block" color="danger">{{ $t('resetLocalData') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonBackButton, IonContent, IonInput, IonButton, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

import mixin from '../mixin'
import { defaultBytesPerQrCode, defaultNumQrCodes } from '../store'

export default defineComponent({
  components: { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonBackButton, IonContent, IonInput, IonButton },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  data(): {
    buildTimestamp: string,
    defaultNumQrCodes: number,
    defaultBytesPerQrCode: number,
    debugModeCounter: number,
    notificationPermission: NotificationPermission | null,
  } {
    return {
      // @ts-expect-error Injected during build process
      // eslint-disable-next-line no-undef
      buildTimestamp: new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(BUILD_TIMESTAMP)),
      defaultNumQrCodes,
      defaultBytesPerQrCode,
      debugModeCounter: 0,
      notificationPermission: ('Notification' in window) ? Notification.permission : null,
    }
  },
  mounted() {
    onIonViewDidEnter(() => {
      this.notificationPermission = ('Notification' in window) ? Notification.permission : null
    })
  },
  computed: {
    showEnablePushNotifications: {
      get(): boolean {
        return this.$store.state.showEnablePushNotifications
      },
      set(value: number) {
        this.$store.commit('setShowEnablePushNotifications', value)
      },
    },
    numQrCodes: {
      get(): number {
        return this.$store.state.numQrCodes
      },
      set(value: string) {
        this.$store.commit('setNumQrCodes', value)
      },
    },
    bytesPerQrCode: {
      get(): number {
        return this.$store.state.bytesPerQrCode
      },
      set(value: string) {
        this.$store.commit('setBytesPerQrCode', value)
      },
    },
    lastTimestamp: {
      get(): number | null {
        return this.$store.state.lastTimestamp
      },
      set(value: number | null) {
        return this.$store.commit('setLastTimestamp', value)
      },
    },
    totalKeySize(): number {
      const total = this.numQrCodes * this.bytesPerQrCode
      return (total >= 0) ? total : 0
    },
  },
  methods: {
    showAndGoToEnablePushNotificationsButton() {
      this.showEnablePushNotifications = true
      this.$router.push('/')
    },
    changeNumericSetting(event: Event, storeCommitId: string, min: number, max: number) {
      const element = event.target as HTMLInputElement
      const integer = parseInt(element.value, 10)
      if (integer >= min && integer <= max) {
        this.$store.commit(storeCommitId, integer)
      } else if (integer > max) {
        element.value = max.toString()
        this.$store.commit(storeCommitId, max)
      } else {
        element.value = min.toString()
        this.$store.commit(storeCommitId, min)
      }
    },
    restoreQrCodeDefaults() {
      this.numQrCodes = this.defaultNumQrCodes
      this.bytesPerQrCode = this.defaultBytesPerQrCode
    },
    exportData() {
      const blob = new Blob([JSON.stringify(localStorage)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Vernam_${this.$store.state.id}_${new Date().getTime()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    importData() {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = '.json'
      fileInput.style.display = 'none'
      document.body.appendChild(fileInput)

      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0]
        if (!file) {
          console.error('No file selected')
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const localStorageData = event.target?.result as string
          try {
            const parsedData: Record<string, string> = JSON.parse(localStorageData)
            localStorage.clear()
            for (const key in parsedData) {
              if (parsedData[key] != null) {
                localStorage.setItem(key, parsedData[key])
              }
            }
            window.location.reload()
          } catch (error) {
            console.error('Error parsing the file:', error)
          }
        }
        reader.readAsText(file)
        document.body.removeChild(fileInput)
      })

      fileInput.click()
    },
    async resetData() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('resetLocalDataTitle'),
        buttons: [
          {
            text: this.$t('resetLocalDataSheetButton'),
            role: 'destructive',
            handler: () => {
              localStorage.clear()
              window.location.reload()
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
    async showDebugActions() {
      this.debugModeCounter += 1
      if (this.debugModeCounter >= 10 && !this.$global.state.debugMode) {
        this.$global.state.debugMode = true
        return
      }
      if (!this.$global.state.debugMode) {
        return
      }
      const actionSheet = await actionSheetController.create({
        buttons: [
          {
            text: this.$t('reloadApp'),
            handler: () => {
              window.location.reload()
            },
          },
          {
            text: this.$t('resetLastTimestamp'),
            handler: () => {
              this.lastTimestamp = null
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
  },
})
</script>

<style scoped>
</style>
