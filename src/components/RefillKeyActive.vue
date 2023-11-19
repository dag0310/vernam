<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left"><v-ons-toolbar-button @click="cancel">{{ $t('cancel') }}</v-ons-toolbar-button></div>
    <div class="center">{{ $t('refillKey') }}</div>
  </v-ons-toolbar>
  <div class="content">
    <h3 v-if="qrCodeNumbersLeft">{{ $tc('codesLeftToScan', qrCodeNumbersLeft.length) }}<br><b>{{ qrCodeNumbersLeft.map(code => `#${code}`).join(', ') }}</b></h3>
    <h3 v-else><b>{{ $t('scanQrCodesOfYourContact') }}</b></h3>
    <qrcode-stream class="qr-stream" @init="onInit" @detect="onDetect" />
    <p><b>{{ scanStatus }}</b></p>
  </div>
  </v-ons-page>
</template>

<script>
  import { QrcodeStream } from 'vue-qrcode-reader'
  import OtpCrypto from 'otp-crypto'

  export default {
    name: 'refillkeyactive',
    components: {
      QrcodeStream,
    },
    props: {
      sendMessageCallback: {
        type: Function,
        required: false,
      }
    },
    data () {
      return {
        scanStatus: '',
        qrCodes: [],
        qrCodeNumbersLeft: null,
        otherId: null,
      }
    },
    created () {
      this.setPollingActive(false)
      this.scanAudio = new Audio('/static/audio/scan.wav')
      this.refilledAudio = new Audio('/static/audio/refilled.wav')
    },
    computed: {
      qrCodeNumbers () {
        return this.qrCodes.map(qrCode => qrCode.number)
      }
    },
    methods: {
      async onInit (promise) {
        this.scanStatus = this.$t('scanStatusPreparingToScan')
        try {
          const { capabilities } = await promise
          console.log({ capabilities })
          this.scanStatus = this.$t('scanStatusReadyToScan')
        } catch (error) {
          this.scanStatus = this.$t(`scanStatus${error.name}`) || `${this.$t('scanStatusUnknownError')}: "${error.name}"`
        }
      },
      async onDetect (promise) {
        const { content } = await promise

        let parsedQrContent
        try {
          parsedQrContent = JSON.parse(content)
        } catch (e) {
          parsedQrContent = this.parseQrContentLegacy(content)  // FIXME: Temporary: Remove in the future
        }

        if (this.otherId == null) {
          this.otherId = parsedQrContent.id
        }
        if (this.otherId !== parsedQrContent.id) {
          this.$ons.notification.toast(this.$t('qrCodeBelongsToAnotherSeries'), { timeout: 3000 })
          return
        }

        if (this.qrCodeNumbers.includes(parsedQrContent.qr)) {
          // Do not show this toast anymore, because in autoplay mode it would be annoying
          // this.$ons.notification.toast(this.$t('youAlreadyScannedThisCode'), { timeout: 3000 })
          return
        }

        const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(parsedQrContent.key)
        this.qrCodes.push({number: parsedQrContent.qr, bytes: keyBytes})
        this.qrCodeNumbersLeft = Array.apply(null, {length: parsedQrContent.qrT})
          .map(Number.call, Number)
          .map(n => n + 1)
          .filter(number => !this.qrCodeNumbers.includes(number))

        this.scanAudio.play()

        if (this.qrCodes.length >= parsedQrContent.qrT) {
          this.finishQrCodeScanning()
        }
      },
      parseQrContentLegacy (content) { // FIXME: Temporary: Remove in the future
        const metaPrefixLength = 7
        const metaPrefix = content.substring(0, metaPrefixLength)
        return {
          id: null,
          qr: parseInt(metaPrefix.substring(0, 2), 10),
          qrT: parseInt(metaPrefix.substring(2, 4), 10),
          threeLetterHash: metaPrefix.substring(4, metaPrefixLength),
          key: content.substring(metaPrefixLength),
        }
      },
      finishQrCodeScanning () {
        const byteArrayTotal = this.buildTotalKeyByteArray(this.qrCodes)
        const keyLengthHalf = Math.ceil(byteArrayTotal.length / 2)
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)))
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentChatId,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf))
        })
        this.$store.commit('setChatOtherId', {
          id: this.$store.state.currentChatId,
          otherId: this.otherId,
        })
        this.refilledAudio.play()
        if (this.sendMessageCallback != null) {
          this.sendMessageCallback()
        }
        this.setPollingActive(true)
        this.$emit('pop-page')
      },
      cancel () {
        this.$ons.openActionSheet({ buttons: [this.$t('yesAbort'), this.$t('noContinue')], title: this.$t('sureYouWantToCancel'), cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            this.setPollingActive(true)
            this.$emit('pop-page')
          }
        })
      }
    }
  }
</script>

<style scoped>
  .content {
    text-align: center;
  }
  .qr-stream {
    width: 100%;
    height: 300px;
  }
</style>
