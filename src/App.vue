<template>
  <v-ons-navigator swipeable
    :page-stack="pageStack"
    @push-page="pageStack.push($event)"
  ></v-ons-navigator>
</template>

<script>
import HomePage from './components/HomePage'
import OtpCrypto from 'otp-crypto'

const pollMessagesIntervalInMs = 1000
const encoder = new TextEncoder()

export default {
  name: 'app',
  created () {
    const pollMessages = () => {
      this.$http.get('messages').then(response => {
        this.conversations.forEach(conversation => {
          const messages = response.body
          messages
            .filter(message => message.sender === conversation.id)
            .forEach(message => {
              this.$http.delete('messages/' + message.id)

              if (conversation.messages.some(m => m.id === message.id)) {
                return
              }

              this.$store.commit('setNewMessagesTrue', conversation.id)
              const otpCryptoResult = OtpCrypto.decrypt(message.payload, this.otherKey(conversation))
              conversation.messages.push({
                id: message.id,
                own: false,
                text: otpCryptoResult.plaintextDecrypted,
                timestamp: message.timestamp
              })
              this.$store.commit('updateOtherKey', {
                id: conversation.id,
                otherKey: otpCryptoResult.remainingKey
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
  },
  methods: {
    otherKey (conversation) {
      return encoder.encode(atob(conversation.otherKey))
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
