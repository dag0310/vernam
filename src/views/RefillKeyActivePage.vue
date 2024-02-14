<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="cancel()">
            {{ $t('cancel') }}
          </ion-button>
        </ion-buttons>
        <ion-title>{{ $t('refill') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-row class="ion-justify-content-center" style="text-align: center;">
        <h4 v-if="qrCodeNumbersLeft != null">{{ $tc('codesLeftToScan', qrCodeNumbersLeft.length) }}:<br>{{ qrCodeNumbersLeft.map(code => `#${code}`).join(', ') }}</h4>
        <h4 v-else>{{ $t('scanQrCodesOfYourContact') }}</h4>
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

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import OtpCrypto from 'otp-crypto'

import mixin from '../mixin'
import { Chat, ParsedQrCode, QrCodeData } from '../types'

export default defineComponent({
  components: { QrcodeStream, IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  data(): {
    scanStatus: string
    qrCodes: ParsedQrCode[]
    qrCodeNumbersLeft: number[] | null
    otherId: string | null
    scanAudio: HTMLAudioElement
    refilledAudio: HTMLAudioElement
  } {
    return {
      scanStatus: this.$t('scanStatusPreparingToScan'),
      qrCodes: [],
      qrCodeNumbersLeft: null,
      otherId: null,
      scanAudio: new Audio('/audio/scan.wav'),
      refilledAudio: new Audio('/audio/refilled.wav'),
    }
  },
  mounted() {
    onIonViewDidEnter(() => {
      this.$global.state.pollingActive = false
    })
  },
  methods: {
    async onReady(capabilitiesPromise: Promise<MediaTrackCapabilities>) {
      this.scanStatus = ''
      const capabilities = await capabilitiesPromise
      console.info({ capabilities })
    },
    onError(error: { name: string }) {
      this.scanStatus = (error.name != null) ? this.$t(`scanStatus${error.name}`) : this.$t('scanStatusUnknownError')
    },
    onDetect(detectedCodes: { rawValue: string }[]) {
      if (detectedCodes.length < 1) {
        return
      }

      let parsedQrCodeData: QrCodeData
      try {
        parsedQrCodeData = JSON.parse(detectedCodes[0].rawValue)
      } catch (err) {
        this.showToast(this.$t('invalidQrCode'))
        return
      }
      if (typeof parsedQrCodeData.id !== 'string') {
        this.showToast(`${this.$t('invalidQrCode')} [id]`)
        return
      }
      if (typeof parsedQrCodeData.qr !== 'number') {
        this.showToast(`${this.$t('invalidQrCode')} [qr]`)
        return
      }
      if (typeof parsedQrCodeData.qrT !== 'number') {
        this.showToast(`${this.$t('invalidQrCode')} [qrT]`)
        return
      }
      if (typeof parsedQrCodeData.key !== 'string') {
        this.showToast(`${this.$t('invalidQrCode')} [key]`)
        return
      }

      if (this.otherId == null) {
        this.otherId = parsedQrCodeData.id
      }
      if (this.otherId !== parsedQrCodeData.id) {
        this.showToast(this.$t('qrCodeBelongsToAnotherSeries'))
        return
      }

      if (this.qrCodes.some(qrCode => qrCode.number === parsedQrCodeData.qr)) {
        // Do not show this toast anymore, because in autoplay mode it would be annoying
        // this.showToast(this.$t('youAlreadyScannedThisCode'))
        return
      }

      const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(parsedQrCodeData.key)
      this.qrCodes.push({ number: parsedQrCodeData.qr, bytes: keyBytes })
      this.qrCodeNumbersLeft = Array.from({ length: parsedQrCodeData.qrT }, (_, i) => i + 1).filter(number => !this.qrCodes.some(qrCode => qrCode.number === number))

      this.scanAudio.play()

      if (this.qrCodes.length >= parsedQrCodeData.qrT) {
        this.finishQrCodeScanning()
      }
    },
    finishQrCodeScanning() {
      const byteArrayTotal = this.buildTotalKeyByteArray(this.qrCodes)
      const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
      this.$store.commit('updateOwnKey', {
        chatId: this.$global.state.currentChatId,
        ownKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)),
      })
      this.$store.commit('updateOtherKey', {
        chatId: this.$global.state.currentChatId,
        otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)),
      })
      this.$store.commit('setChatOtherId', {
        chatId: this.$global.state.currentChatId,
        otherId: this.otherId,
      })
      this.refilledAudio.play()
      const currentChat = this.$store.state.chats.find((chat: Chat) => chat.id === this.$global.state.currentChatId)
      if (currentChat.message === '') {
        this.$store.commit('updateMessage', {
          chatId: this.$global.state.currentChatId,
          message: this.$t('helloChatMessage', { name: currentChat.name }),
        })
      }
      this.$global.state.pollingActive = true
      this.$router.back()
    },
    async cancel() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('sureYouWantToCancel'),
        buttons: [
          {
            text: this.$t('yesAbort'),
            role: 'destructive',
            handler: () => {
              this.$global.state.pollingActive = true
              this.$router.back()
            },
          },
          {
            text: this.$t('noContinue'),
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
