<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="cancel()">
            {{ t('cancel') }}
          </ion-button>
        </ion-buttons>
        <ion-title>{{ t('refill') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="done()" :disabled="shownQrCodes.size < store.numQrCodes">
            {{ t('done') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="currentQrCode">
      <ion-row class="ion-justify-content-center">
        <h2>#{{ currentQrCode.number }} / {{ store.numQrCodes }}</h2>
      </ion-row>
      <ion-row class="ion-justify-content-center">
        <img :src="currentQrCode.dataUrl" @click="stopAutoplay(); setCurrentQrCode(+1)" style="width: 100%; max-width: 640px; cursor: pointer;" alt="">
      </ion-row>
      <ion-row class="ion-justify-content-center">
        <ion-button @click="stopAutoplay(); setCurrentQrCode(-1)" fill="solid" color="dark" size="large">
          <ion-icon :icon="ionIconSkipBackward" :aria-label="t('previous')" />
        </ion-button>
        <ion-button @click="(autoplayInterval == null) ? startAutoplay() : stopAutoplay()" fill="solid" color="dark" size="large">
          <ion-icon :icon="ionIconPlay" v-show="autoplayInterval == null" :aria-label="t('play')" />
          <ion-icon :icon="ionIconPause" v-show="autoplayInterval != null" :aria-label="t('pause')" />
        </ion-button>
        <ion-button @click="stopAutoplay(); setCurrentQrCode(+1)" fill="solid" color="dark" size="large">
          <ion-icon :icon="ionIconSkipForward" :aria-label="t('next')" />
        </ion-button>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton, IonIcon, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { playSkipBack as ionIconSkipBackward, play as ionIconPlay, pause as ionIconPause, playSkipForward as ionIconSkipForward } from 'ionicons/icons'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import OtpCrypto from 'otp-crypto'
import QRCode from 'qrcode'

import { Chat, ParsedQrCodePassive, QrCodeData } from '../types'
import useStore from '../store'
import useGlobalStore from '../global'
import { buildTotalKeyByteArray, showToast } from '../mixin'

const store = useStore()
const global = useGlobalStore()
const router = useRouter()
const { t } = useI18n()

const autoplayIntervalInMs = 1000
const refilledAudio = new Audio('/audio/refilled.wav')

const qrCodes = ref([] as ParsedQrCodePassive[])
const currentQrCode = ref(null as ParsedQrCodePassive | null)
const shownQrCodes = ref(new Set() as Set<number>)
const autoplayInterval = ref(null as ReturnType<typeof setTimeout> | null)

function setCurrentQrCode(increment?: 1 | -1): void {
  let currentNumber: number
  if (currentQrCode.value != null && increment != null) {
    currentNumber = currentQrCode.value.number + increment
    if (currentNumber > store.numQrCodes) {
      currentNumber = 1
    } else if (currentNumber < 1) {
      currentNumber = store.numQrCodes
    }
  } else {
    currentNumber = 1
  }
  const localCurrentQrCode = qrCodes.value.find(qrCode => qrCode.number === currentNumber)
  if (localCurrentQrCode == null) {
    const errorMessage = `QR Code ${currentNumber} not found.`
    showToast(errorMessage)
    throw Error(errorMessage)
  }
  currentQrCode.value = localCurrentQrCode
  shownQrCodes.value.add(currentNumber)
}

function startAutoplay(): void {
  if (autoplayInterval.value != null) {
    return
  }
  autoplayInterval.value = setInterval(() => {
    setCurrentQrCode(+1)
  }, autoplayIntervalInMs)
}

function stopAutoplay(): void {
  if (autoplayInterval.value == null) {
    return
  }
  clearInterval(autoplayInterval.value)
  autoplayInterval.value = null
}

async function initQrCodes(): Promise<void> {
  const promises = []
  for (let number = 1; number <= store.numQrCodes; number += 1) {
    const randomBytes = OtpCrypto.generateRandomBytes(store.bytesPerQrCode)
    const randomBytesBase64 = OtpCrypto.encryptedDataConverter.bytesToBase64(randomBytes)
    const qrDataObject: QrCodeData = {
      id: store.id,
      qr: number,
      qrT: store.numQrCodes,
      key: randomBytesBase64,
    }
    const promise = QRCode.toDataURL([{ data: JSON.stringify(qrDataObject) as unknown as Buffer, mode: 'byte' }], { type: 'image/png', errorCorrectionLevel: 'L' })
    promises.push(promise.then((dataUrl): ParsedQrCodePassive => ({ number, bytes: randomBytes, dataUrl })))
  }
  qrCodes.value = await Promise.all(promises)
  setCurrentQrCode()
  startAutoplay()
}

onMounted(() => {
  initQrCodes()
  onIonViewDidEnter(() => {
    global.pollingActive = false
  })
})

function saveQrCodeKeys(): void {
  const byteArrayTotal = buildTotalKeyByteArray(qrCodes.value)
  const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
  const currentChat = store.chats.find((chat: Chat) => chat.id === global.currentChatId)
  if (currentChat == null) {
    return
  }
  store.updateOwnKey(currentChat.id, OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)))
  store.updateOtherKey(currentChat.id, OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)))
  store.setChatOtherId(currentChat.id, null)
}

async function done(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('didContactFinishScanning'),
    buttons: [
      {
        text: t('yesScanningFinished'),
        role: 'confirm',
        handler: (): void => {
          saveQrCodeKeys()
          refilledAudio.play()
          stopAutoplay()
          global.pollingActive = true
          router.back()
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

async function cancel(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('sureYouWantToCancel'),
    buttons: [
      {
        text: t('yesAbort'),
        role: 'destructive',
        handler: (): void => {
          stopAutoplay()
          global.pollingActive = true
          router.back()
        },
      },
      {
        text: t('noContinue'),
        role: 'cancel',
      },
    ],
  })
  await actionSheet.present()
}
</script>

<style scoped>
</style>
