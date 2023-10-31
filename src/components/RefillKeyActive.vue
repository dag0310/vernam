<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left"><v-ons-toolbar-button @click="cancel">Cancel</v-ons-toolbar-button></div>
    <div class="center">Refill Key</div>
  </v-ons-toolbar>
  <div class="content">
    <h3 v-if="qrCodeNumbersLeft">{{qrCodeNumbersLeft.length}} code<template v-if="qrCodeNumbersLeft.length !== 1">s</template> left to scan:<br><b>{{ qrCodeNumbersLeft.map(code => `#${code}`).join(', ') }}</b></h3>
    <h3 v-else><b>Scan QR codes of your contact.</b></h3>
    <qrcode-stream class="qr-stream" @init="onInit" @detect="onDetect" />
    <p><b>{{ scanStatus }}</b></p>
  </div>
  </v-ons-page>
</template>

<script>
  import { QrcodeStream } from 'vue-qrcode-reader'
  import OtpCrypto from 'otp-crypto'

  const metaPrefixLength = 7

  const scanConfig = {
    preferFrontCamera: false,
    showFlipCameraButton: false,
    showTorchButton: false,
    torchOn: false,
    saveHistory: false,
    prompt: 'Place a QR code inside the scan area.',
    resultDisplayDuration: 0,
    formats: 'QR_CODE',
    orientation: 'portrait',
    disableAnimations: true,
    disableSuccessBeep: true
  }

  export default {
    name: 'refillkeyactive',
    components: {
      QrcodeStream,
    },
    data () {
      return {
        scanStatus: '',
        qrCodes: [],
        qrCodeNumbersLeft: null
      }
    },
    created () {
      this.scanAudio = new Audio('/static/scan.wav')
      this.refilledAudio = new Audio('/static/refilled.wav')
    },
    computed: {
      qrCodeNumbers () {
        return this.qrCodes.map(qrCode => qrCode.number)
      }
    },
    methods: {
       async onInit (promise) {
        this.scanStatus = 'Preparing to scan ...'
        try {
          const { capabilities } = await promise
          console.log({ capabilities })
          this.scanStatus = 'Ready to scan.'
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            this.scanStatus = 'User denied camera access permisson.'
          } else if (error.name === 'NotFoundError') {
            this.scanStatus = 'No suitable camera device installed.'
          } else if (error.name === 'NotSupportedError' || error.name === 'InsecureContextError') {
            this.scanStatus = 'Page is not served over HTTPS (or localhost).'
          } else if (error.name === 'NotReadableError') {
            this.scanStatus = 'Maybe camera is already in use.'
          } else if (error.name === 'OverconstrainedError') {
            this.scanStatus = 'Did you requested the front camera although there is none?'
          } else if (error.name === 'StreamApiNotSupportedError') {
            this.scanStatus = 'Browser seems to be lacking features.'
          } else {
            this.scanStatus = 'Unknown error: "' + error.name + '"'
          }
        }
      },
      async onDetect (promise) {
          const { content } = await promise
          const parsedMetaPrefix = this.parseMetaPrefix(content.substr(0, metaPrefixLength))

          // Temporarily disabled
          // const checksum = this.generateChecksumFromStrings(this.$store.state.id, this.$store.state.currentConversationId)
          // if (checksum !== parsedMetaPrefix.checksum && parsedMetaPrefix.checksum !== '---') {
          //   this.$ons.notification.alert('Your conversations\' IDs do not fit together.')
          //   this.$emit('pop-page')
          //   return
          // }

          if (this.qrCodeNumbers.includes(parsedMetaPrefix.number)) {
            this.$ons.notification.toast('You already scanned this code.', {timeout: 3000})
            return
          }

          const keyBase64String = content.substring(metaPrefixLength)
          const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(keyBase64String)
          this.qrCodes.push({number: parsedMetaPrefix.number, bytes: keyBytes})
          this.qrCodeNumbersLeft = Array.apply(null, {length: parsedMetaPrefix.numQrCodes})
            .map(Number.call, Number)
            .map(n => n + 1)
            .filter(number => !this.qrCodeNumbers.includes(number))

          if (this.qrCodes.length >= parsedMetaPrefix.numQrCodes) {
            this.finishQrCodeScanning()
        } else {
          this.scanAudio.play()
        }
      },
      parseMetaPrefix (metaPrefix) {
        return {
          number: parseInt(metaPrefix.substring(0, 2), 10),
          numQrCodes: parseInt(metaPrefix.substring(2, 4), 10),
          checksum: metaPrefix.substring(4, metaPrefixLength)
        }
      },
      finishQrCodeScanning () {
        const byteArrayTotal = this.sortedBytesOfQrCodes(this.qrCodes)
        const keyLengthHalf = byteArrayTotal.length - parseInt(byteArrayTotal.length / 2, 10)
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)))
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentConversationId,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf))
        })
        this.refilledAudio.play()
        this.$emit('pop-page')
      },
      cancel () {
        this.$ons.openActionSheet({ buttons: ['Yes, abort', 'No, continue'], title: 'Sure you want to cancel?', cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
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
