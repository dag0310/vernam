<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left"><v-ons-toolbar-button @click="cancel">{{ $t('cancel') }}</v-ons-toolbar-button></div>
    <div class="center">{{ $t('refillKey') }}</div>
    <div class="right"><v-ons-toolbar-button @click="done" :disabled="isDoneButtonDisabled">{{ $t('done') }}</v-ons-toolbar-button>
  </div>
  </v-ons-toolbar>
  <div class="content">
    <img v-if="currentQrCode" :src="currentQrCode.dataUrl" class="qrCode" @click="stopAutoplay(); setCurrentQrCode(+1)">
    <div class="navigationAndCounter" v-if="currentQrCode">
      <h3>#{{ currentQrCode.number }} / {{ numQrCodes }}</h3>
      <v-ons-button modifier="outline" class="pull-left" @click="stopAutoplay(); setCurrentQrCode(-1)" :aria-label="$t('previous')">
        <v-ons-icon icon="ion-ios-skip-backward, material:ion-md-skip-backward"></v-ons-icon>
      </v-ons-button>
      <v-ons-button modifier="outline" class="pull-center" @click="(autoplayInterval == null) ? startAutoplay() : stopAutoplay()">
        <v-ons-icon v-if="autoplayInterval == null" icon="ion-ios-play, material:ion-md-play" :aria-label="$t('play')"></v-ons-icon>
        <v-ons-icon v-if="autoplayInterval != null" icon="ion-ios-pause, material:ion-md-pause" :aria-label="$t('pause')"></v-ons-icon>
      </v-ons-button>
      <v-ons-button modifier="outline" class="pull-right" @click="stopAutoplay(); setCurrentQrCode(+1)">
        <v-ons-icon icon="ion-ios-skip-forward, material:ion-md-skip-forward" :aria-label="$t('next')"></v-ons-icon>
      </v-ons-button>
      <div class="clearfix"></div>
    </div>
  </div>
  </v-ons-page>
</template>

<script>
  import QRCode from 'qrcode'
  import OtpCrypto from 'otp-crypto'

  const autoplayIntervalInMs = 1000

  export default {
    name: 'refillkeypassive',
    data () {
      return {
        qrCodes: null,
        currentQrCode: null,
        seenQrCodes: {},
        numQrCodes: null,
        bytesPerQrCode: null,
        isDoneButtonDisabled: true,
        autoplayInterval: null,
      }
    },
    created () {
      this.$global.state.pollingActive = false
      this.numQrCodes = this.$store.state.numQrCodes
      this.bytesPerQrCode = this.$store.state.bytesPerQrCode
      this.initQrCodes()
      this.refilledAudio = new Audio('/static/audio/refilled.wav')
    },
    methods: {
      initQrCodes () {
        this.qrCodes = null
        this.currentQrCode = null
        const qrCodes = []
        const promises = []
        for (let number = 1; number <= this.numQrCodes; number++) {
          const randomBytes = OtpCrypto.generateRandomBytes(this.bytesPerQrCode)
          const randomText = OtpCrypto.encryptedDataConverter.bytesToBase64(randomBytes)
          const dataObj = {
            id: this.$store.state.id,
            qr: number,
            qrT: this.numQrCodes,
            key: randomText,
          }
          promises.push(QRCode.toDataURL([{ data: JSON.stringify(dataObj), mode: 'byte' }], {errorCorrectionLevel: 'L'}).then(dataUrl => {
            qrCodes.push({number: number, bytes: randomBytes, dataUrl: dataUrl})
          }).catch(err => {
            console.error(err)
          }))
        }
        Promise.all(promises).then(() => {
          if (qrCodes.length <= 0) {
            return
          }
          this.qrCodes = qrCodes
          this.setCurrentQrCode()
          this.startAutoplay()
        })
      },
      setCurrentQrCode (direction) {
        if (!this.qrCodes) {
          return
        }

        let currentNumber
        if (this.currentQrCode && direction !== undefined) {
          currentNumber = this.currentQrCode.number + direction
          if (currentNumber > this.numQrCodes) {
            currentNumber = 1
          } else if (currentNumber < 1) {
            currentNumber = this.numQrCodes
          }
        } else {
          currentNumber = 1
        }

        this.currentQrCode = this.qrCodes.find(qrCode => qrCode.number === currentNumber)
        this.seenQrCodes[currentNumber] = true

        if (Object.keys(this.seenQrCodes).length === this.numQrCodes && this.isDoneButtonDisabled) {
          this.isDoneButtonDisabled = false
        }
      },
      startAutoplay () {
        if (this.autoplayInterval != null) {
          return
        }
        this.autoplayInterval = setInterval(() => {
          this.setCurrentQrCode(+1, true)
        }, autoplayIntervalInMs)
      },
      stopAutoplay () {
        if (this.autoplayInterval == null) {
          return
        }
        clearInterval(this.autoplayInterval)
        this.autoplayInterval = null
      },
      done () {
        this.$ons.openActionSheet({ buttons: [this.$t('yesScanningFinished'), this.$t('cancel')], title: this.$t('didContactFinishScanning'), cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            this.saveQrCodeKeys()
            this.refilledAudio.play()
            this.stopAutoplay()
            this.$global.state.pollingActive = true
            this.$emit('pop-page')
          }
        })
      },
      cancel () {
        this.$ons.openActionSheet({ buttons: [this.$t('yesAbort'), this.$t('noContinue')], title: this.$t('sureYouWantToCancel'), cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            this.stopAutoplay()
            this.$global.state.pollingActive = true
            this.$emit('pop-page')
          }
        })
      },
      saveQrCodeKeys () {
        const byteArrayTotal = this.buildTotalKeyByteArray(this.qrCodes)
        const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)))
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentChatId,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf))
        })
        this.$store.commit('setChatOtherId', {
          id: this.$store.state.currentChatId,
          otherId: null,
        })
      },
    }
  }
</script>

<style scoped>
  .content {
    text-align: center;
  }
  .qrCode {
    margin-top: 15px;
    min-width: 308px;
    max-width: 100%;
    cursor: pointer;
  }
  .navigationAndCounter {
    padding: 0 15px 10px;
  }
  .navigationAndCounter ons-button {
    min-width: 100px;
  }
  .navigationAndCounter ons-button .ons-icon {
    vertical-align: baseline;
  }
</style>
