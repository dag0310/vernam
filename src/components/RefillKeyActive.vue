<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left">
      <v-ons-back-button>Back</v-ons-back-button>
  </div>
    <div class="center">Refill Key</div>
  </v-ons-toolbar>
  <div class="content">
    <h3>Codes left: <b>{{ qrCodeNumbersLeftText }}</b></h3>
    <v-ons-button modifier="large" class="abortButton" @click="abort = true">Abort</v-ons-button>
  </div>
  </v-ons-page>
</template>

<script>
  import OtpCrypto from 'otp-crypto'

  const waitTimeAfterScanInMs = 500
  const metaPrefixParts = 2
  const metaPrefixPartLength = 2
  const metaPrefixLength = metaPrefixParts * metaPrefixPartLength

  export default {
    name: 'refillkeyactive',
    data () {
      return {
        qrCodes: [],
        qrCodeNumbersLeftText: '',
        abort: false
      }
    },
    created () {
      if (!window.cordova) {
        console.error('QR scanning not possible on this device / No global cordova object found.')
      }
      document.addEventListener('deviceready', event => {
        if (!window.cordova.plugins.barcodeScanner) {
          console.error('Cordova plugin "barcodeScanner" not found.')
          return
        }
        this.scanBarcode()
      }, false)
    },
    computed: {
      qrCodesNumbers () {
        return this.qrCodes.map(qrCode => qrCode.number)
      }
    },
    methods: {
      scanBarcode () {
        window.cordova.plugins.barcodeScanner.scan(result => {
          if (this.abort) {
            this.$emit('pop-page')
            return
          }
          if (result.format !== 'QR_CODE' || result.cancelled) {
            setTimeout(this.scanBarcode, waitTimeAfterScanInMs)
            return
          }

          const parsedMetaPrefix = this.parseMetaPrefix(result.text.substr(0, metaPrefixLength))

          if (this.qrCodesNumbers.includes(parsedMetaPrefix.number)) {
            setTimeout(this.scanBarcode, waitTimeAfterScanInMs)
            return
          }

          const keyBase64String = result.text.substring(metaPrefixLength)
          const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(keyBase64String)
          this.qrCodes.push({number: parsedMetaPrefix.number, bytes: keyBytes})
          this.updateQrCodeNumbersLeftText(parsedMetaPrefix.numQrCodes)

          if (this.qrCodes.length >= parsedMetaPrefix.numQrCodes) {
            this.finishQrCodeScanning()
            return
          }

          setTimeout(this.scanBarcode, waitTimeAfterScanInMs)
        }, error => {
          console.error('Scanning failed: ' + error)
        })
      },
      parseMetaPrefix (metaPrefix) {
        return {
          number: parseInt(metaPrefix.substr(0, metaPrefixPartLength), 10),
          numQrCodes: parseInt(metaPrefix.substring(metaPrefixPartLength), 10)
        }
      },
      updateQrCodeNumbersLeftText (qrCodesTotal) {
        const allQrCodeNumbers = Array.apply(null, {length: qrCodesTotal}).map(Number.call, Number).map(idx => idx + 1)
        const qrCodeNumbersLeft = allQrCodeNumbers.filter(number => !this.qrCodesNumbers.includes(number))
        this.qrCodeNumbersLeftText = qrCodeNumbersLeft.join(', ')
      },
      finishQrCodeScanning () {
        const byteArrayTotal = this.sortedBytesOfQrCodes(this.qrCodes)
        const keyLengthHalf = byteArrayTotal.length - parseInt(byteArrayTotal.length / 2, 10)
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf)))
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentConversationId,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf))
        })
        this.$ons.notification.alert('Click "Finished" on the other device before sending messages.')
        this.$emit('pop-page')
      }
    }
  }
</script>

<style scoped>
  .content {
    text-align: center;
  }
  .abortButton {
    display: inline-block;
    width: 80%;
    max-width: 300px;
    margin-top: 10px;
  }
</style>
