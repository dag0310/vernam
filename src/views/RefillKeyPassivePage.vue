<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="cancel()">
            {{ $t('cancel') }}
          </ion-button>
        </ion-buttons>
        <ion-title>{{ $t('refillKey') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="done()" :disabled="shownQrCodes.size < numQrCodes">
            {{ $t('done') }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="currentQrCode">
      <img :src="currentQrCode.dataUrl" @click="stopAutoplay(); setCurrentQrCode(+1)" style="width: 100%; cursor: pointer;">
      <ion-row class="ion-justify-content-center">
        <h2>#{{ currentQrCode.number }} / {{ numQrCodes }}</h2>
      </ion-row>
      <ion-row class="ion-justify-content-center">
        <ion-button @click="stopAutoplay(); setCurrentQrCode(-1)" :aria-label="$t('previous')">
          <ion-icon :icon="ionIconSkipBackward"></ion-icon>
        </ion-button>
        <ion-button @click="(autoplayInterval == null) ? startAutoplay() : stopAutoplay()">
          <ion-icon :icon="ionIconPlay" v-show="autoplayInterval == null" :aria-label="$t('play')"></ion-icon>
          <ion-icon :icon="ionIconPause" v-show="autoplayInterval != null" :aria-label="$t('pause')"></ion-icon>
        </ion-button>
        <ion-button @click="stopAutoplay(); setCurrentQrCode(+1)">
          <ion-icon :icon="ionIconSkipForward" :aria-label="$t('next')"></ion-icon>
        </ion-button>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton, IonIcon, actionSheetController, onIonViewDidEnter } from '@ionic/vue'
import { playSkipBack as ionIconSkipBackward, play as ionIconPlay, pause as ionIconPause, playSkipForward as ionIconSkipForward } from 'ionicons/icons'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import OtpCrypto from 'otp-crypto'
import QRCode from 'qrcode'

import mixin from '../mixin'
import { ParsedQrCodePassive, QrCodeData } from '../types'

const autoplayIntervalInMs = 1000

export default defineComponent({
  components: { IonPage, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent, IonRow, IonButton, IonIcon },
  props: {
    $store: Object as PropType<any>,
    $global: Object as PropType<any>,
  },
  mixins: [mixin],
  data(): {
    qrCodes: ParsedQrCodePassive[]
    currentQrCode: ParsedQrCodePassive | null
    shownQrCodes: Set<number>
    numQrCodes: number
    bytesPerQrCode: number
    autoplayInterval: ReturnType<typeof setTimeout> | null
    refilledAudio: HTMLAudioElement
    ionIconSkipBackward: string
    ionIconPlay: string
    ionIconPause: string
    ionIconSkipForward: string
  } {
    return {
      qrCodes: [],
      currentQrCode: null,
      shownQrCodes: new Set(),
      numQrCodes: this.$store.state.numQrCodes,
      bytesPerQrCode: this.$store.state.bytesPerQrCode,
      autoplayInterval: null,
      refilledAudio: new Audio('/audio/refilled.wav'),
      ionIconSkipBackward,
      ionIconPlay,
      ionIconPause,
      ionIconSkipForward,
    }
  },
  mounted() {
    this.initQrCodes()
    onIonViewDidEnter(() => {
      this.$global.state.pollingActive = false
    })
  },
  methods: {
    async initQrCodes() {
      const promises = []
      for (let number = 1; number <= this.numQrCodes; number += 1) {
        const randomBytes = OtpCrypto.generateRandomBytes(this.bytesPerQrCode)
        const randomBytesBase64 = OtpCrypto.encryptedDataConverter.bytesToBase64(randomBytes)
        const qrDataObject: QrCodeData = {
          id: this.$store.state.id,
          qr: number,
          qrT: this.numQrCodes,
          key: randomBytesBase64,
        }
        const promise = QRCode.toDataURL([{ data: JSON.stringify(qrDataObject) as unknown as Buffer, mode: 'byte' }], { type: 'image/png', errorCorrectionLevel: 'L' })
        promises.push(promise.then((dataUrl): ParsedQrCodePassive => ({ number, bytes: randomBytes, dataUrl })))
      }
      this.qrCodes = await Promise.all(promises)
      this.setCurrentQrCode()
      this.startAutoplay()
    },
    setCurrentQrCode(increment?: 1 | -1) {
      let currentNumber: number
      if (this.currentQrCode != null && increment != null) {
        currentNumber = this.currentQrCode.number + increment
        if (currentNumber > this.numQrCodes) {
          currentNumber = 1
        } else if (currentNumber < 1) {
          currentNumber = this.numQrCodes
        }
      } else {
        currentNumber = 1
      }
      const currentQrCode = this.qrCodes.find(qrCode => qrCode.number === currentNumber)
      if (currentQrCode == null) {
        const errorMessage = `QR Code ${currentNumber} not found.`
        this.showToast(errorMessage)
        throw Error(errorMessage)
      }
      this.currentQrCode = currentQrCode
      this.shownQrCodes.add(currentNumber)
    },
    startAutoplay() {
      if (this.autoplayInterval != null) {
        return
      }
      this.autoplayInterval = setInterval(() => {
        this.setCurrentQrCode(+1)
      }, autoplayIntervalInMs)
    },
    stopAutoplay() {
      if (this.autoplayInterval == null) {
        return
      }
      clearInterval(this.autoplayInterval)
      this.autoplayInterval = null
    },
    async done() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('didContactFinishScanning'),
        buttons: [
          {
            text: this.$t('yesScanningFinished'),
            role: 'destructive',
            handler: () => {
              this.saveQrCodeKeys()
              this.refilledAudio.play()
              this.stopAutoplay()
              this.$global.state.pollingActive = true
              this.$router.back()
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
    async cancel() {
      const actionSheet = await actionSheetController.create({
        header: this.$t('sureYouWantToCancel'),
        buttons: [
          {
            text: this.$t('yesAbort'),
            role: 'destructive',
            handler: () => {
              this.stopAutoplay()
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
    saveQrCodeKeys() {
      const byteArrayTotal = this.buildTotalKeyByteArray(this.qrCodes)
      const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
      this.$store.commit('updateOwnKey', {
        chatId: this.$store.state.currentChatId,
        ownKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)),
      })
      this.$store.commit('updateOtherKey', {
        chatId: this.$store.state.currentChatId,
        otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)),
      })
      this.$store.commit('setChatOtherId', {
        chatId: this.$store.state.currentChatId,
        otherId: null,
      })
    },
  },
})
</script>

<style scoped>
</style>
