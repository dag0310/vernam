<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left">
      <v-ons-back-button>Back</v-ons-back-button>
  </div>
    <div class="center">Refill Key</div>
  </v-ons-toolbar>
  <div class="content">
    <div class="navigationAndCounter" v-if="currentQrCode">
      <v-ons-button modifier="outline" class="pull-left" @click="setCurrentQrCode(-1)">Previous</v-ons-button>
      <v-ons-button modifier="outline" class="pull-right" @click="setCurrentQrCode(+1)">Next</v-ons-button>
      <h3>{{ currentQrCode.number }} / {{ numQrCodes }}</h3>
      <div class="clearfix"></div>
    </div>
    <img v-if="currentQrCode" :src="currentQrCode.dataUrl" class="qrCode" @click="setCurrentQrCode(+1)">
    <br>
    <v-ons-button modifier="large" class="finishedButton" @click="finished" v-show="qrCodes">Finished</v-ons-button>
  </div>
  </v-ons-page>
</template>

<script>
  import QRCode from 'qrcode'
  import OtpCrypto from 'otp-crypto'

  const numQrCodes = 10
  const bytesPerQrCode = 500

  export default {
    name: 'refillkeypassive',
    data () {
      return {
        qrCodes: null,
        currentQrCode: null,
        numQrCodes
      }
    },
    created () {
      this.initQrCodes()
    },
    methods: {
      initQrCodes () {
        this.qrCodes = null
        this.currentQrCode = null
        const qrCodes = []
        const promises = []
        for (let number = 1; number <= numQrCodes; number++) {
          const metaPrefix = ('' + number).padStart(2, '0') + ('' + numQrCodes).padStart(2, '0')
          const randomBytes = OtpCrypto.generateRandomBytes(bytesPerQrCode)
          const randomText = OtpCrypto.encryptedDataConverter.bytesToBase64(randomBytes)
          promises.push(QRCode.toDataURL([{ data: metaPrefix + randomText, mode: 'byte' }], {errorCorrectionLevel: 'L'}).then(dataUrl => {
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
          this.currentQrCode = this.qrCodes.find(qrCode => qrCode.number === 1)
        })
      },
      setCurrentQrCode (direction) {
        if (!this.currentQrCode || !this.qrCodes) {
          return
        }
        direction = (direction === undefined) ? 1 : direction
        let currentNumber = this.currentQrCode.number + direction
        if (currentNumber > numQrCodes) {
          currentNumber = 1
        } else if (currentNumber < 1) {
          currentNumber = numQrCodes
        }
        this.currentQrCode = this.qrCodes.find(qrCode => qrCode.number === currentNumber)
      },
      finished () {
        this.$ons.openActionSheet({ buttons: ['Yes, finished!', 'Cancel'], title: 'Partner finshed scanning?', cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            const byteArrayTotal = this.sortedBytesOfQrCodes(this.qrCodes)
            const keyLengthHalf = byteArrayTotal.length - parseInt(byteArrayTotal.length / 2, 10)
            this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)))
            this.$store.commit('updateOtherKey', {
              id: this.$store.state.currentConversationId,
              otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf))
            })
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
  .qrCode {
    min-width: 308px;
    max-width: 100%;
    cursor: pointer;
  }
  .navigationAndCounter {
    padding: 15px 15px 10px;
  }
  .finishedButton {
    display: inline-block;
    width: 80%;
    max-width: 300px;
    margin-top: 10px;
  }
</style>
