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
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-row class="ion-justify-content-center" style="text-align: center;">
        <h4 v-if="qrCodeNumbersLeft != null">{{ t('codesLeftToScan', qrCodeNumbersLeft.length) }}:<br>{{ qrCodeNumbersLeft.map((number: number) => `#${number}`).join(', ') }}</h4>
        <h4 v-else>{{ t('scanQrCodesOfYourContact') }}</h4>
      </ion-row>
      <ion-row class="ion-justify-content-center">
        <qrcode-stream @camera-on="onReady" @detect="onDetect" @error="onError" :formats="['qr_code']" style="width: 100%; max-width: 640px; height: auto;" />
      </ion-row>
      <ion-row v-show="scanStatus" class="ion-justify-content-center info-text ion-margin-top">
        {{ scanStatus }}
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { QrcodeStream } from 'vue-qrcode-reader'
import OtpCrypto from 'otp-crypto'

import { Chat, ParsedQrCode, QrCodeData } from '../types'
import useStore from '../store'
import useGlobalStore from '../global'
import { buildTotalKeyByteArray, showToast } from '../mixin'

const store = useStore()
const global = useGlobalStore()
const router = useRouter()
const { t } = useI18n()

const scanAudio = new Audio('/audio/scan.wav')
const refilledAudio = new Audio('/audio/refilled.wav')

const scanStatus = ref(t('scanStatusPreparingToScan'))
const qrCodes = ref([] as ParsedQrCode[])
const qrCodeNumbersLeft = ref(null as number[] | null)
const otherId = ref(null as string | null)

onMounted(() => {
  onIonViewDidEnter(() => {
    global.pollingActive = false
  })
})

async function onReady(capabilitiesPromise: Promise<MediaTrackCapabilities>): Promise<void> {
  scanStatus.value = ''
  const capabilities = await capabilitiesPromise
  console.info({ capabilities })
}

function onError(error: { name: string }): void {
  scanStatus.value = (error.name != null) ? t(`scanStatus${error.name}`) : t('scanStatusUnknownError')
}

function onDetect(detectedCodes: { rawValue: string }[]): void {
  if (detectedCodes.length < 1) {
    return
  }

  let parsedQrCodeData: QrCodeData
  try {
    parsedQrCodeData = JSON.parse(detectedCodes[0].rawValue)
  } catch (err) {
    showToast(t('invalidQrCode'))
    return
  }
  if (typeof parsedQrCodeData.id !== 'string') {
    showToast(`${t('invalidQrCode')} [id]`)
    return
  }
  if (typeof parsedQrCodeData.qr !== 'number') {
    showToast(`${t('invalidQrCode')} [qr]`)
    return
  }
  if (typeof parsedQrCodeData.qrT !== 'number') {
    showToast(`${t('invalidQrCode')} [qrT]`)
    return
  }
  if (typeof parsedQrCodeData.key !== 'string') {
    showToast(`${t('invalidQrCode')} [key]`)
    return
  }

  if (otherId.value == null) {
    otherId.value = parsedQrCodeData.id
  }
  if (otherId.value !== parsedQrCodeData.id) {
    showToast(t('qrCodeBelongsToAnotherSeries'))
    return
  }

  if (qrCodes.value.some(qrCode => qrCode.number === parsedQrCodeData.qr)) {
    // Do not show this toast anymore, because in autoplay mode it would be annoying
    // showToast(t('youAlreadyScannedThisCode'))
    return
  }

  const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(parsedQrCodeData.key)
  qrCodes.value.push({ number: parsedQrCodeData.qr, bytes: keyBytes })
  qrCodeNumbersLeft.value = Array.from({ length: parsedQrCodeData.qrT }, (_, i) => i + 1).filter(number => !qrCodes.value.some(qrCode => qrCode.number === number))

  scanAudio.play()

  if (qrCodes.value.length >= parsedQrCodeData.qrT) {
    const byteArrayTotal = buildTotalKeyByteArray(qrCodes.value)
    const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
    const currentChat = store.chats.find((chat: Chat) => chat.id === global.currentChatId)
    if (currentChat == null) {
      return
    }
    store.updateOwnKey(currentChat.id, OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)))
    store.updateOtherKey(currentChat.id, OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)))
    store.setChatOtherId(currentChat.id, otherId.value)
    refilledAudio.play()
    if (currentChat.message === '') {
      store.updateMessage(currentChat.id, t('helloChatMessage', { name: currentChat.name }))
    }
    global.pollingActive = true
    router.back()
  }
}

async function cancel(): Promise<void> {
  const actionSheet = await actionSheetController.create({
    header: t('sureYouWantToCancel'),
    buttons: [
      {
        text: t('yesAbort'),
        role: 'destructive',
        handler: (): void => {
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
