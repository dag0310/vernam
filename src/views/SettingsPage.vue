<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" :text="t('back')" />
        </ion-buttons>
        <ion-title>{{ t('settings') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- PUSH NOTIFICATIONS -->
      <h2>{{ t('pushNotifications') }}</h2>
      <ion-button @click="showAndGoToEnablePushNotificationsButton()" v-if="notificationPermission === 'default'" expand="block">{{ t('enablePushNotifications') }}</ion-button>
      <span v-else-if="notificationPermission === 'granted'" v-html="t('pushNotificationsGrantedMessage')" />
      <span v-else-if="notificationPermission === 'denied'" v-html="t('pushNotificationsDeniedMessage')" />
      <template v-else>
        {{ t('notificationPermissionNotSupported') }}
        <span v-html="buildNotificationPermissionNotSupportedMessage()" />
      </template>
      <!-- SHOW QR CODES -->
      <h2>{{ t('showQrCodes') }}</h2>
      <ion-input @ionChange="store.numQrCodes = sanitizeNumericValue($event, 1, 60)" v-model="store.numQrCodes" :label="t('amount')" label-placement="start" type="number" step="1" inputmode="numeric" autocomplete="off" required />
      <ion-input @ionChange="store.bytesPerQrCode = sanitizeNumericValue($event, 1, 1000)" v-model="store.bytesPerQrCode" :label="t('dataPerQrCode')" label-placement="start" type="number" step="50" inputmode="numeric" autocomplete="off" required />
      <ion-input :label="t('keyRefillData')" label-placement="start" readonly :value="`${keySize} ${t('bytes')}`" />
      <ion-button @click="restoreQrCodeDefaults()" v-show="store.numQrCodes !== defaultNumQrCodes || store.bytesPerQrCode !== defaultBytesPerQrCode" size="small" color="light" class="ion-margin-top">{{ t('restoreDefaults') }}</ion-button>
      <!-- ABOUT -->
      <h2 @click="showDebugActions()">{{ t('about') }}</h2>
      <div v-if="global.debugMode" style="user-select: text; font-size: 0.9rem;">
        <p>{{ t('id') }}: {{ store.id }}</p>
        <p>{{ t('lastTimestamp') }}: {{ store.lastTimestamp }}</p>
        <p>{{ t('version') }}: {{ buildTimestamp }}</p>
        <p><textarea v-if="global.debugString.length > 0" v-model="global.debugString" style="width: 100%; height: 50px;" /></p>
      </div>
      <ion-button @click="showIntroDialog()" expand="block" color="dark">{{ t('introTitle') }}</ion-button>
      <!-- DATA -->
      <h2>{{ t('dataSectionHeader') }}</h2>
      <ion-button @click="exportData()" expand="block" color="dark">{{ t('exportLocalData') }}</ion-button>
      <ion-button @click="importData()" expand="block" color="dark">{{ t('importLocalData') }}</ion-button>
      <ion-button @click="resetData()" expand="block" color="danger">{{ t('resetLocalData') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonBackButton, IonContent, IonInput, IonButton, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useStore, { defaultBytesPerQrCode, defaultNumQrCodes } from '../store'
import useGlobalStore from '../global'
import { buildNotificationPermissionNotSupportedMessage, showIntroDialog } from '../mixin'

const store = useStore()
const global = useGlobalStore()
const router = useRouter()
const { t } = useI18n()

// @ts-expect-error Injected during build process
// eslint-disable-next-line no-undef
const buildTimestamp = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(BUILD_TIMESTAMP))
const debugModeCounter = ref(0)
const notificationPermission = ref(('Notification' in window) ? Notification.permission : null)

onMounted(() => {
  onIonViewDidEnter(() => {
    notificationPermission.value = ('Notification' in window) ? Notification.permission : null
  })
})

const keySize = computed(() => {
  const size = (store.numQrCodes * store.bytesPerQrCode) / 2
  return (size >= 0) ? size : 0
})

function showAndGoToEnablePushNotificationsButton(): void {
  store.showEnablePushNotifications = true
  router.push('/')
}

function sanitizeNumericValue(event: Event, min: number, max: number): number {
  const element = event.target as HTMLInputElement
  const integer = parseInt(element.value, 10)
  if (integer >= min && integer <= max) {
    return integer
  }
  if (integer > max) {
    element.value = max.toString()
    return max
  }
  element.value = min.toString()
  return min
}

function restoreQrCodeDefaults(): void {
  store.numQrCodes = defaultNumQrCodes
  store.bytesPerQrCode = defaultBytesPerQrCode
}

function exportData(): void {
  const blob = new Blob([JSON.stringify(localStorage)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Vernam_${store.id}_${new Date().getTime()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(): void {
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
    reader.onload = (event): void => {
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
}

async function resetData(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('resetLocalDataTitle'),
    buttons: [
      {
        text: t('resetLocalDataSheetButton'),
        role: 'destructive',
        handler: (): void => {
          localStorage.clear()
          window.location.reload()
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

async function showDebugActions(): Promise<void> {
  debugModeCounter.value += 1
  if (debugModeCounter.value >= 10 && !global.debugMode) {
    global.debugMode = true
    return
  }
  if (!global.debugMode) {
    return
  }
  const actionSheet = await actionSheetController.create({
    buttons: [
      {
        text: t('reloadApp'),
        handler: (): void => {
          window.location.reload()
        },
      },
      {
        text: t('resetLastTimestamp'),
        handler: (): void => {
          store.lastTimestamp = null
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
</script>

<style scoped>
</style>
