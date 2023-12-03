<template>
  <v-ons-navigator swipeable
    :page-stack="pageStack"
    @push-page="pageStack.push($event)"
    @pop-page="pageStack.pop($event)"
    @replace-page="pageStack.pop(); pageStack.push($event)"
  ></v-ons-navigator>
</template>

<script>
import HomePage from './components/HomePage'
import OtpCrypto from 'otp-crypto'

const pollMessagesIntervalInMs = 1000

export default {
  name: 'app',
  created () {
    const pollMessages = async () => {
      if (!this.$store.state.id || !this.isPollingActive()) {
        setTimeout(pollMessages, pollMessagesIntervalInMs)
        return
      }
      const params = {}
      if (this.$store.state.lastTimestamp != null) {
        params.timestamp = this.$store.state.lastTimestamp
      }
      try {
        const response = await this.$http.get(`messages/${this.$store.state.id}`, { timeout: 5000, params })
        for (const message of response.body) {
          let senderChat = this.chats.find(chat => chat.otherId === message.sender)
          const chatCandidates = (senderChat != null) ? [senderChat] : this.chats.filter(chat => chat.otherId == null)
          const chat = chatCandidates.find(chatCandidate => this.isAuthenticatedPayload(message.payload, chatCandidate.otherKey))
          if (chat == null) {
            if (this.isDebugMode(this.$store.state.id)) {
              this.$ons.notification.toast('isAuthenticatedPayload() = ' + this.isAuthenticatedPayload(message.payload, senderChat.otherKey), { timeout: 3000 })
              this.$ons.notification.toast('senderChat.otherId = ' + senderChat.otherId, { timeout: 3000 })
            }
            this.$store.commit('setLastTimestamp', message.timestamp)
            continue
          }
          const expectedDeleteMessageResponse = await this.deleteMessageOnServerAndSaveLocally(message, chat)
          if (expectedDeleteMessageResponse === true) {
            this.$store.commit('setLastTimestamp', message.timestamp)
            continue
          }
          break
        }
      } catch (error) {
        switch (error.status) {
          case 0:
            break
          default:
            if (error.status != null) {
              this.$ons.notification.toast('[GET] ' + this.$t('unexpectedErrorWithCode', { code: error.status }), { timeout: 3000 })
            } else {
              this.$ons.notification.toast('[GET] ' + this.$t('unexpectedError', { timeout: 3000 }))
            }
            console.error(error)
        }
      } finally {
        setTimeout(pollMessages, pollMessagesIntervalInMs)
      }
    }
    pollMessages()
  },
  data () {
    return {
      pageStack: [HomePage],
    }
  },
  computed: {
    chats () {
      return this.$store.state.chats
    }
  },
  methods: {
    isAuthenticatedPayload (payloadBase64, otherKeyBase64) {
      const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(otherKeyBase64)
      const otpCryptoResult = OtpCrypto.decrypt(payloadBase64, otherKeyBytes)
      const payloadPreamble = otpCryptoResult.plaintextDecrypted.substring(0, this.AUTH_PREAMBLE.length)
      return payloadPreamble === this.AUTH_PREAMBLE
    },
    async deleteMessageOnServerAndSaveLocally (message, chat) {
      const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(chat.otherKey)
      const otherKeyBytesPreambleLength = otherKeyBytes.slice(0, OtpCrypto.decryptedDataConverter.strToBytes(this.AUTH_PREAMBLE).length)
      const base64Key = OtpCrypto.encryptedDataConverter.bytesToBase64(otherKeyBytesPreambleLength)

      try {
        await this.$http.delete(`messages/${encodeURIComponent(message.sender)}/${message.timestamp}/${encodeURIComponent(base64Key)}`, { timeout: 5000, headers: { 'Content-Type': 'text/plain' } })

        if (chat.otherId == null) {
          this.$store.commit('setChatOtherId', {
            id: chat.id,
            otherId: message.sender,
          })
        }

        const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)

        this.$store.commit('updateOtherKey', {
          id: chat.id,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey)
        })

        chat.messages.push({
          id: `${message.sender}${message.timestamp}`,
          own: false,
          text: otpCryptoResult.plaintextDecrypted.substring(this.AUTH_PREAMBLE.length),
          timestamp: message.timestamp
        })

        if (this.$store.state.currentChatId !== chat.id) {
          this.$store.commit('setNewMessagesTrue', chat.id)
        }

        return true
      } catch (error) {
        switch (error.status) {
          case 0:
            return false
          case 400: // Message validation failed
          case 401: // Message authentication failed
          case 404: // Message not found
            if (this.isDebugMode(this.$store.state.id)) {
              this.$ons.notification.toast('message.sender = ' + message.sender, { timeout: 3000 })
              this.$ons.notification.toast('message.timestamp = ' + message.timestamp, { timeout: 3000 })
              this.$ons.notification.toast('base64Key = ' + base64Key, { timeout: 3000 })
              this.$ons.notification.toast('[DELETE][DEBUG] ' + this.$t('unexpectedErrorWithCode', { code: error.status }), { timeout: 3000 })
            }
            return true
          default:
            if (error.status != null) {
              this.$ons.notification.toast('[DELETE] ' + this.$t('unexpectedErrorWithCode', { code: error.status }), { timeout: 3000 })
            } else {
              this.$ons.notification.toast('[DELETE] ' + this.$t('unexpectedError', { timeout: 3000 }))
            }
            console.error(error)
            return false
        }
      }
    }
  }
}
</script>

<style>
  body {
    max-width: 500px;
    margin: 0 auto;
    background-color: black;
  }
  .searchContainer {
    position: relative;
  }
  .marginalizedContent {
    padding: 0 15px;
  }
  .infoText {
    text-align: center;
    font-style: italic;
    color: gray;
  }
  .searchContainer ons-search-input {
    width: 100%;
  }
  .searchContainer ons-search-input .search-input {
    padding-right: 30px;
  }
  .searchContainer .clearSearch {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    padding: 5px 10px;
    cursor: pointer;
    color: gray;
  }
  .selectable, .selectable * {
    user-select: text;
  }
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bold {
    font-weight: bold;
  }
  .clearfix {
    clear: both;
  }
  ons-toolbar.toolbar {
    padding-top: 0 !important;
  }
  .page[status-bar-fill]>.toolbar:not(.toolbar--cover-content)+.page__background+.page__content,
  .page[status-bar-fill]>.toolbar:not(.toolbar--transparent)+.page__background {
    top: 44px !important;
  }
</style>
