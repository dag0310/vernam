<template>
  <v-ons-navigator swipeable
    :page-stack="pageStack"
    @push-page="pageStack.push($event)"
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
    const messageIdsToDismiss = {}
    const authSecretLength = this.AUTH_SECRET.length
    const pollMessages = () => {
      this.$http.get('messages/' + this.$store.state.id).then(response => {
        const messages = response.body
        this.conversations.forEach(conversation => {
          messages
            .filter(message => message.sender === conversation.id && !messageIdsToDismiss[message.sender + message.timestamp])
            .forEach(message => {
              const otherKeyBytes = OtpCrypto.encryptedDataConverter.base64ToBytes(conversation.otherKey)
              const base64KeyUriEncoded = encodeURIComponent(OtpCrypto.encryptedDataConverter.bytesToBase64(otherKeyBytes.slice(0, authSecretLength)))
              const polledMessageId = message.sender + message.timestamp

              this.$http.delete('messages/' + message.sender + '/' + message.timestamp + '/' + base64KeyUriEncoded)

              if (conversation.messages.some(message => message.id === polledMessageId)) {
                return
              }

              const otpCryptoResult = OtpCrypto.decrypt(message.payload, otherKeyBytes)
              if (!otpCryptoResult.isKeyLongEnough || otpCryptoResult.plaintextDecrypted.slice(0, authSecretLength) !== this.AUTH_SECRET) {
                messageIdsToDismiss[polledMessageId] = true
                return
              }

              if (conversation.id !== this.$store.state.currentConversationId) {
                this.$store.commit('setNewMessagesTrue', conversation.id)
              }
              conversation.messages.push({
                id: polledMessageId,
                own: false,
                text: otpCryptoResult.plaintextDecrypted.slice(authSecretLength),
                timestamp: message.timestamp
              })
              this.$store.commit('updateOtherKey', {
                id: conversation.id,
                otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(otpCryptoResult.remainingKey)
              })
            })
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
</style>
