<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center ellipsis" @click="informationDialogVisible = true">{{ conversation.name }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="refillKey">
          <template v-if="keyEmpty">Refill 🔑</template>
          <template v-else>🔑 {{ remainingKeyLength }}</template>
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
              <span class="messageInfoDate">{{ dateTimeText(message.timestamp) }}</span>
              <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click="deleteMessage(message)"></ons-icon>
            </span>
            <div class="clearfix"></div>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0">No messages found</div>
      <div class="marginalizedContent keyRefillInfoBox" v-if="keyAlmostEmpty">
        <div class="infoText">Your key is <span v-if="!keyEmpty">almost</span> empty &ndash;<br>Please refill it together with your contact to send messages.</div>
        <v-ons-button modifier="large" @click="refillKey">Refill 🔑</v-ons-button>
      </div>
      <div class="buffer"></div>
    </div>
    <v-ons-bottom-toolbar>
      <textarea class="textarea" v-model="message" autocomplete="off"></textarea>
      <v-ons-button modifier="quiet" class="sendButton" @click="sendMessage" :disabled="!message || !otpCryptoResult.isKeyLongEnough || !sendButtonEnabled">Send</v-ons-button>
    </v-ons-bottom-toolbar>
    <v-ons-dialog cancelable :visible.sync="informationDialogVisible">
      <p>Name: <b>{{conversation.name}}</b></p>
      <p>Phone number: <b>{{conversation.id}}</b></p>
      <p>Other key size/checksum: <b>{{otherKey.length}} / {{generateChecksum(otherKey)}}</b></p>
      <p>Own key size/checksum: <b>{{ownKey.length}} / {{generateChecksum(ownKey)}}</b></p>
    </v-ons-dialog>
    <v-ons-progress-circular indeterminate v-show="showLoadingIndicator"></v-ons-progress-circular>
  </v-ons-page>
</template>

<script>
import OtpCrypto from 'otp-crypto'
import RefillKeyActive from './RefillKeyActive'
import RefillKeyPassive from './RefillKeyPassive'

const keyAlmostEmptyThreshold = 100

export default {
  name: 'conversation',
  data () {
    return {
      searchText: '',
      sendButtonEnabled: true,
      showLoadingIndicator: false,
      informationDialogVisible: false
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
        .filter(message => message.text.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => a.timestamp - b.timestamp)
    },
    ownKey () {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.conversation.ownKey)
    },
    otherKey () {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.conversation.otherKey)
    },
    keyAlmostEmpty () {
      return OtpCrypto.encrypt(this.AUTH_SECRET + 'V'.repeat(keyAlmostEmptyThreshold), this.ownKey).remainingKey.length <= 0
    },
    keyEmpty () {
      return OtpCrypto.encrypt(this.AUTH_SECRET, this.ownKey).remainingKey.length <= 0
    },
    otpCryptoResult () {
      return OtpCrypto.encrypt(this.AUTH_SECRET + this.message, this.ownKey)
    },
    remainingKeyLength () {
      return this.otpCryptoResult.isKeyLongEnough ? this.otpCryptoResult.remainingKey.length : 'X'
    }
  },
  methods: {
    dateTimeText (timestamp) {
      const humanDate = this.humanDate(timestamp)
      return humanDate.dateText + ', ' + humanDate.timeText
    },
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: ['Delete message', 'Cancel'], title: message.text, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteMessage', message.id)
        }
      })
    },
    sendMessage () {
      if (!this.otpCryptoResult.isKeyLongEnough) {
        return
      }
      this.sendButtonEnabled = false
      this.$http.post('messages', {
        sender: this.$store.state.id,
        receiver: this.conversation.id,
        payload: this.otpCryptoResult.base64Encrypted
      }).then(response => {
        const message = response.body
        this.conversation.messages.push({
          id: message.sender + message.timestamp,
          own: true,
          text: this.message,
          timestamp: message.timestamp
        })
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(this.otpCryptoResult.remainingKey))
        this.message = ''
      }, response => {
        this.$ons.notification.toast('Message could not be sent.', { timeout: 1000 })
      }).then(() => {
        this.sendButtonEnabled = true
      })
    },
    refillKey () {
      if (!window.cordova) {
        this.$emit('push-page', RefillKeyPassive)
        return
      }
      this.showLoadingIndicator = true
      this.$ons.openActionSheet({buttons: ['I scan', 'I show [not perfect secrecy]', 'Cancel'], title: 'Refill key: What is your part?', cancelable: true}).then(response => {
        this.showLoadingIndicator = false
        if (response === 0) {
          this.$emit('push-page', RefillKeyActive)
        } else if (response === 1) {
          this.$emit('push-page', RefillKeyPassive)
        }
      })
    },
    generateChecksum (bytes) {
      let checksum = 0
      bytes.forEach(byte => { checksum ^= byte })
      return checksum
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
  ons-progress-circular {
    position: fixed;
    top: 75%;
    left: 50%;
    transform: translate(-50%);
  }
  .dialog-container > * {
    text-align: center;
  }
</style>
