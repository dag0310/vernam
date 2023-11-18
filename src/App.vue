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
    // FIXME: Temporary: Legacy conversations state migration
    if (this.$store.state.conversations != null) {
      for (const conversation of this.$store.state.conversations) {
        this.$store.commit('createChat', JSON.parse(JSON.stringify(conversation)))
      }
      this.$store.commit('deleteLegacyConversations')
    }
    if (this.$store.state.currentConversationId != null) {
      this.$store.commit('setCurrentChatId', this.$store.state.currentConversationId)
      this.$store.commit('deleteLegacyCurrentConversationId')
    }

    const pollMessages = () => {
      if (!this.$store.state.id || !this.isPollingActive()) {
        setTimeout(pollMessages, pollMessagesIntervalInMs)
        return
      }
      const lastTimestampQueryString = (this.$store.state.lastTimestamp !== null) ? `?timestamp=${this.$store.state.lastTimestamp}` : ''
      this.$http.get(`messages/${this.$store.state.id}${lastTimestampQueryString}`, { timeout: 5000 }).then(response => {
        const messages = response.body
        this.chats.forEach(chat => {
          const chatMessages = messages.filter(message => message.sender === chat.otherId || chat.otherId == null)
          this.pollMessage(chat, chatMessages, 0)
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
    chats () {
      return this.$store.state.chats
    }
  },
  methods: {
    pollMessage (chat, chatMessages, messageIdx) {
      if (messageIdx >= chatMessages.length) {
        return
      }
      const message = chatMessages[messageIdx]
      const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(chat.otherKey)
      const otherKeyBytesPreambleLength = otherKeyBytes.slice(0, OtpCrypto.decryptedDataConverter.strToBytes(this.AUTH_PREAMBLE).length)
      const base64Key = OtpCrypto.encryptedDataConverter.bytesToBase64(otherKeyBytesPreambleLength)
      const polledMessageId = `${message.sender}${message.timestamp}`

      this.$http.delete(`messages/${encodeURIComponent(message.sender)}/${message.timestamp}/${encodeURIComponent(base64Key)}`, { timeout: 5000 }).then(() => {
        this.$store.commit('setLastTimestamp', message.timestamp)
        const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)
        if (!otpCryptoResult.isKeyLongEnough || otpCryptoResult.plaintextDecrypted.substring(0, this.AUTH_PREAMBLE.length) !== this.AUTH_PREAMBLE) {
          this.pollMessage(chat, chatMessages, messageIdx + 1)
          return
        }

        this.$store.commit('updateOtherKey', {
          id: chat.id,
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey)
        })
        if (chat.otherId == null) {
          this.$store.commit('setChatOtherId', {
            id: chat.id,
            otherId: message.sender,
          })
        }

        if (chat.messages.some(message => message.id === polledMessageId)) {
          this.pollMessage(chat, chatMessages, messageIdx + 1)
          return
        }

        if (chat.id !== this.$store.state.currentChatId) {
          this.$store.commit('setNewMessagesTrue', chat.id)
        }
        chat.messages.push({
          id: polledMessageId,
          own: false,
          text: otpCryptoResult.plaintextDecrypted.substring(this.AUTH_PREAMBLE.length),
          timestamp: message.timestamp
        })
        this.pollMessage(chat, chatMessages, messageIdx + 1)
      }, response => {
        if (response.status >= 400 && response.status < 500) {
          this.$store.commit('setLastTimestamp', message.timestamp)
          this.pollMessage(chat, chatMessages, messageIdx + 1)
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
