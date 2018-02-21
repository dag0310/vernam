<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center ellipsis">{{ conversation.name }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="refillKey">
          <template v-if="keyEmpty">Refill 🔑</template>
          <template v-else>~{{ approxWordsLeftToSend }} w</template>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content" v-chat-scroll>
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input placeholder="Search" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
      </p>
      <div v-for="message in filteredMessages" :key="(message.own ? 'own' : 'other') + '-' + message.id">
        <div class="card" :class="{ownMessage: message.own}">
          <div class="card__content">
            <span class="messageText">{{ message.text }}</span>
            <br>
            <span class="messageInfo">
              <span class="messageInfoDate">{{ message.dateText }}, {{ message.timeText }}</span>
              <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click="deleteMessage(message)"></ons-icon>
            </span>
            <div class="clearfix"></div>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0">
        No messages found
      </div>
      <div class="marginalizedContent keyRefillInfoBox" v-if="keyAlmostEmpty">
        <div class="infoText">Your key is <span v-if="!keyEmpty">almost</span> empty &ndash;<br>Please refill it to send more messages.</div>
        <v-ons-button modifier="large" @click="refillKey">Refill 🔑</v-ons-button>
      </div>
      <div class="buffer"></div>
    </div>
    <v-ons-bottom-toolbar>
      <textarea class="textarea" v-model="message"></textarea>
      <v-ons-button modifier="quiet" class="sendButton" @click="sendMessage" :disabled="messageEmpty || keyEmpty || ownKeyLength <= 0">Send</v-ons-button>
    </v-ons-bottom-toolbar>
  </v-ons-page>
</template>

<script>
import OtpCrypto from 'otp-crypto'

const approxBytesPerWord = 5
const keyAlmostEmptyThreshold = 100
const keyEmptyThreshold = 5

export default {
  name: 'conversation',
  data () {
    return {
      searchText: ''
    }
  },
  computed: {
    conversation () {
      return this.$store.getters.currentConversation
    },
    message: {
      get () {
        return this.$store.getters.currentConversation.message
      },
      set (value) {
        this.$store.commit('updateMessage', value)
      }
    },
    filteredMessages () {
      return this.conversation.messages
        .map(message => {
          const humanDate = this.humanDate(message.timestamp)
          message.dateText = humanDate.dateText
          message.timeText = humanDate.timeText
          return message
        })
        .filter(message => message.text.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => a.timestamp - b.timestamp)
    },
    messageEmpty () {
      return !this.message
    },
    ownKey () {
      return this.base64ToBytes(this.conversation.ownKey)
    },
    keyAlmostEmpty () {
      return this.ownKey.length < keyAlmostEmptyThreshold
    },
    keyEmpty () {
      return this.ownKey.length < keyEmptyThreshold
    },
    otpCryptoResult () {
      return OtpCrypto.encrypt(this.message, this.ownKey)
    },
    ownKeyLength () {
      if (this.otpCryptoResult === null) {
        return 0
      }
      return this.otpCryptoResult.remainingKey.length
    },
    approxWordsLeftToSend () {
      return Math.round(this.ownKeyLength / approxBytesPerWord)
    }
  },
  methods: {
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: ['Delete message', 'Cancel'], title: message.text, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteMessage', message.id)
        }
      })
    },
    sendMessage () {
      if (this.otpCryptoResult === null) {
        return
      }
      this.$http.post('messages', {
        receiver: this.conversation.id,
        payload: this.otpCryptoResult.base64Encrypted
      }).then(response => {
        const message = response.body
        this.conversation.messages.push({
          id: message.id,
          own: true,
          text: this.message,
          timestamp: message.timestamp
        })
        this.$store.commit('updateOwnKey', this.bytesToBase64(this.otpCryptoResult.remainingKey))
        this.message = ''
      }, response => {
        this.$ons.notification.toast('Message could not be sent.', { timeout: 1000 })
      })
    },
    refillKey () {
      this.$ons.notification.toast('TODO: Refill key', { timeout: 1000 })
    }
  }
}
</script>

<style scoped>
  .card {
    max-width: 230px;
    padding: 5px 10px;
    word-wrap: break-word;
  }
  .ownMessage {
    float: right;
    background-color: rgba(54, 102, 205, 0.2);
  }
  .messageInfo {
    font-size: 10px;
    float: right;
    color: rgba(0, 0, 0, 0.5);
  }
  .textarea {
    width: 75%;
    height: 100%;
  }
  .sendButton {
    width: 25%;
    height: 100%;
    text-align: right;
    padding: 0 8px 0 0;
  }
  .buffer {
    width: 100%;
    height: 15px;
  }
  ons-bottom-toolbar {
    padding: 5px;
    font-size: 0;
  }
  .keyRefillInfoBox {
    text-align: center;
    margin: 25px 0 15px;
  }
  .keyRefillInfoBox .infoText {
    margin-bottom: 5px;
  }
</style>
