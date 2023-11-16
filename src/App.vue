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
    const pollMessages = () => {
      if (!this.$store.state.id) {
        setTimeout(pollMessages, pollMessagesIntervalInMs)
        return
      }
      const lastTimestampQueryString = (this.$store.state.lastTimestamp !== null) ? `?timestamp=${this.$store.state.lastTimestamp}` : ''
      this.$http.get(`messages/${this.$store.state.id}${lastTimestampQueryString}`, { timeout: 5000 }).then(response => {
        const messages = response.body
        this.conversations.forEach(conversation => {
          const conversationMessages = messages.filter(message => message.sender === conversation.otherId || conversation.otherId == null)
          this.pollMessage(conversation, conversationMessages, 0)
        })
      }).then(() => {
        setTimeout(pollMessages, pollMessagesIntervalInMs)
      })
    }
    pollMessages()
  },
  data () {
    return {
      pageStack: [HomePage]
    }
  },
  computed: {
    conversations () {
      return this.$store.state.conversations
    }
  },
  methods: {
    pollMessage (conversation, conversationMessages, idx) {
      if (idx >= conversationMessages.length) {
        return
      }
      const message = conversationMessages[idx]
      const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(conversation.otherKey)
      const authSecretLengthKeyBytes = otherKeyBytes.slice(0, OtpCrypto.decryptedDataConverter.strToBytes(this.AUTH_SECRET).length)
      const base64Key = OtpCrypto.encryptedDataConverter.bytesToBase64(authSecretLengthKeyBytes)
      const polledMessageId = `${message.sender}${message.timestamp}`

      this.$http.delete(`messages/${encodeURIComponent(message.sender)}/${message.timestamp}/${encodeURIComponent(base64Key)}`, { timeout: 5000 }).then(() => {
        this.$store.commit('setLastTimestamp', message.timestamp)
        const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)
        if (!otpCryptoResult.isKeyLongEnough || otpCryptoResult.plaintextDecrypted.substring(0, this.AUTH_SECRET.length) !== this.AUTH_SECRET) {
          this.pollMessage(conversation, conversationMessages, idx + 1)
          return
        }

        this.$store.commit('updateOtherKey', {
          id: conversation.id,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey)
        })
        if (conversation.otherId == null) {
          this.$store.commit('setConversationOtherId', {
            id: conversation.id,
            otherId: message.sender,
          })
        }

        if (conversation.messages.some(message => message.id === polledMessageId)) {
          this.pollMessage(conversation, conversationMessages, idx + 1)
          return
        }

        if (conversation.id !== this.$store.state.currentConversationId) {
          this.$store.commit('setNewMessagesTrue', conversation.id)
        }
        conversation.messages.push({
          id: polledMessageId,
          own: false,
          text: otpCryptoResult.plaintextDecrypted.substring(this.AUTH_SECRET.length),
          timestamp: message.timestamp
        })
        this.pollMessage(conversation, conversationMessages, idx + 1)
      }, response => {
        if (response.status >= 400 && response.status < 500) {
          this.$store.commit('setLastTimestamp', message.timestamp)
          this.pollMessage(conversation, conversationMessages, idx + 1)
        }
      })
    }
  }
}
</script>

<style>
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
