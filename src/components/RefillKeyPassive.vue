<template>
<v-ons-page>
  <v-ons-toolbar>
    <div class="left"><v-ons-toolbar-button @click="cancel">Cancel</v-ons-toolbar-button></div>
    <div class="center">Refill Key</div>
    <div class="right"><v-ons-toolbar-button @click="done" :disabled="isDoneButtonDisabled">Done</v-ons-toolbar-button>
  </div>
  </v-ons-toolbar>
  <div class="content">
    <div class="navigationAndCounter" v-if="currentQrCode">
      <v-ons-button modifier="outline" class="pull-left" @click="setCurrentQrCode(-1)">Previous</v-ons-button>
      <v-ons-button modifier="outline" class="pull-right" @click="setCurrentQrCode(+1)">Next</v-ons-button>
      <h3>#{{ currentQrCode.number }} / {{ numQrCodes }}</h3>
      <div class="clearfix"></div>
  </div>
    <img v-if="currentQrCode" :src="currentQrCode.dataUrl" class="qrCode" @click="setCurrentQrCode(+1)">
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
        numQrCodes,
        seenQrCodes: {},
        backupKeys: {},
        isDoneButtonDisabled: true
      }
    },
    created () {
      this.initQrCodes()
      this.backupKeys.own = this.$store.getters.currentConversation.ownKey
      this.backupKeys.other = this.$store.getters.currentConversation.otherKey
    },
    methods: {
      initQrCodes () {
        this.qrCodes = null
        this.currentQrCode = null
        const qrCodes = []
        const promises = []
        for (let number = 1; number <= numQrCodes; number++) {
          const checksum = this.generateChecksumFromStrings(this.$store.state.id, this.$store.state.currentConversationId)
          const metaPrefix = ('' + number).padStart(2, '0') + ('' + numQrCodes).padStart(2, '0') + checksum
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
          this.setCurrentQrCode()
        })
      },
      setCurrentQrCode (direction) {
        if (!this.qrCodes) {
          return
        }

        let currentNumber
        if (this.currentQrCode && direction !== undefined) {
          currentNumber = this.currentQrCode.number + direction
          if (currentNumber > numQrCodes) {
            currentNumber = 1
          } else if (currentNumber < 1) {
            currentNumber = numQrCodes
          }
        } else {
          currentNumber = 1
        }

        this.currentQrCode = this.qrCodes.find(qrCode => qrCode.number === currentNumber)
        this.seenQrCodes[currentNumber] = true

        if (Object.keys(this.seenQrCodes).length === numQrCodes && this.isDoneButtonDisabled) {
          this.saveQrCodeKeys()
          this.isDoneButtonDisabled = false
        }
      },
      done () {
        this.$ons.openActionSheet({ buttons: ['Yes, they finished', 'Cancel'], title: 'Did the other party finish scanning?', cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            this.$emit('pop-page')
          }
        })
      },
      cancel () {
        this.$ons.openActionSheet({ buttons: ['Yes, abort', 'No, continue'], title: 'Sure you want to cancel?', cancelable: true, destructive: 0 }).then(response => {
          if (response === 0) {
            this.restoreBackupKeys()
            this.$emit('pop-page')
          }
        })
      },
      saveQrCodeKeys () {
        const byteArrayTotal = this.sortedBytesOfQrCodes(this.qrCodes)
        const keyLengthHalf = byteArrayTotal.length - parseInt(byteArrayTotal.length / 2, 10)
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(keyLengthHalf)))
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentConversationId,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(byteArrayTotal.slice(0, keyLengthHalf))
        })
      },
      restoreBackupKeys () {
        this.$store.commit('updateOwnKey', this.backupKeys.own)
        this.$store.commit('updateOtherKey', {
          id: this.$store.state.currentConversationId,
          otherKey: this.backupKeys.other
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
  .navigationAndCounter ons-button {
    min-width: 100px;
  }
</style>
