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
    const pollMessages = () => {
      this.$http.get('messages').then(response => {
        const messages = response.body
        this.conversations.forEach(conversation => {
          messages
            .filter(message => message.sender === conversation.id)
            .forEach(message => {
              this.$http.delete('messages/' + message.id)

              if (conversation.messages.some(m => m.id === message.id)) {
                return
              }

              const otpCryptoResult = OtpCrypto.decrypt(message.payload, this.base64ToBytes(conversation.otherKey))
              if (!otpCryptoResult.isKeyLongEnough) {
                return
              }

              if (conversation.id !== this.$store.state.currentConversationId) {
                this.$store.commit('setNewMessagesTrue', conversation.id)
              }

              conversation.messages.push({
                id: message.id,
                own: false,
                text: otpCryptoResult.plaintextDecrypted,
                timestamp: message.timestamp
              })
              this.$store.commit('updateOtherKey', {
                id: conversation.id,
                otherKey: this.bytesToBase64(otpCryptoResult.remainingKey)
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
