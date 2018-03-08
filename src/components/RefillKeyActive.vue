<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left"><v-ons-toolbar-button @click="cancel">Cancel</v-ons-toolbar-button></div>
    <div class="center">Refill Key</div>
  </v-ons-toolbar>
  <div class="content">
    <h3 v-if="qrCodeNumbersLeft">{{qrCodeNumbersLeft.length}} code<template v-if="qrCodeNumbersLeft.length !== 1">s</template> left to scan:<br><b>{{ qrCodeNumbersLeft.join(', ') }}</b></h3>
    <h3 v-else>Scan QR codes of your contact.</b></h3>
    <v-ons-button modifier="large" class="scanButton" @click="scanBarcode">Scan next QR code</v-ons-button>
  </div>
  </v-ons-page>
</template>

<script>
  import OtpCrypto from 'otp-crypto'

  const metaPrefixLength = 7

  export default {
    name: 'refillkeyactive',
    data () {
      return {
        qrCodes: [],
        qrCodeNumbersLeft: null
      }
    },
    created () {
      document.addEventListener('deviceready', this.scanBarcode, false)
    },
    computed: {
      qrCodeNumbers () {
        return this.qrCodes.map(qrCode => qrCode.number)
      }
    },
    methods: {
      scanBarcode () {
        window.cordova.plugins.barcodeScanner.scan(result => {
          if (result.format !== 'QR_CODE' || result.cancelled) {
            this.$ons.notification.toast('Sorry, please try again.', {timeout: 3000})
            return
          }

          const parsedMetaPrefix = this.parseMetaPrefix(result.text.substr(0, metaPrefixLength))
          const checksum = this.generateChecksumFromPhoneNumbers(this.$store.state.id, this.$store.state.currentConversationId)

          if (checksum !== parsedMetaPrefix.checksum) {
            this.$ons.notification.alert('Your conversations\' phone numbers do not fit together.')
            this.$emit('pop-page')
            return
          }

          if (this.qrCodeNumbers.includes(parsedMetaPrefix.number)) {
            this.$ons.notification.toast('You already scanned this code.', {timeout: 3000})
            return
          }

          const keyBase64String = result.text.substring(metaPrefixLength)
          const keyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(keyBase64String)
          this.qrCodes.push({number: parsedMetaPrefix.number, bytes: keyBytes})
          this.qrCodeNumbersLeft = Array.apply(null, {length: parsedMetaPrefix.numQrCodes})
            .map(Number.call, Number)
            .map(n => n + 1)
            .filter(number => !this.qrCodeNumbers.includes(number))

          if (this.qrCodes.length >= parsedMetaPrefix.numQrCodes) {
            this.finishQrCodeScanning()
          }
        }, error => {
          console.error('Scanning failed: ' + error)
        })
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
  .scanButton {
    display: inline-block;
    width: 80%;
    height: 300px;
    line-height: 300px;
    max-width: 300px;
    margin-top: 10px;
  }
</style>
