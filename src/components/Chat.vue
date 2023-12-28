<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>{{ $t('back') }}</v-ons-back-button>
      </div>
      <div class="center ellipsis" @click="informationDialogVisible = true">{{ chat.name }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="refillKey">
          <span v-if="keyEmpty">{{ $t('refill') }}</span>
          <span v-else :class="{ negative: otpCryptoResult.bytesLeft < 0 }">🔑 {{ otpCryptoResult.isKeyLongEnough ? otpCryptoResultWithoutPreamble.remainingKey.length : otpCryptoResult.bytesLeft }}</span>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content" v-chat-scroll="{ always: true, smooth: false, scrollonremoved: true }">
      <p class="searchContainer marginalizedContent" v-show="searchText.length > 0 || filteredMessages.length > 0">
        <v-ons-search-input :placeholder="$t('searchbarPlaceholder')" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0"><v-ons-icon icon="ion-ios-close, material:ion-md-close"></v-ons-icon></span>
      </p>
      <div v-for="message in filteredMessages" :key="(message.own ? 'own' : 'other') + '-' + message.id">
        <div class="card" :class="{ownMessage: message.own}">
          <div class="card__content">
            <span v-html="message.html" class="messageText selectable"></span>
            <br>
            <span class="messageInfo">
              <span class="messageInfoDate">{{ dateTimeText(message.timestamp) }}</span>
              <v-ons-icon icon="ion-ios-trash, material:ion-md-trash" class="list-item__icon" @click="deleteMessage(message)" :aria-label="$t('deleteMessageLocally')"></v-ons-icon>
            </span>
            <div class="clearfix"></div>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
      <p>
        <div class="marginalizedContent infoText" v-show="chat.otherId == null && !keyEmpty">{{ $t('noOtherIdMessage') }}</div>
        <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0 && searchText.length > 0">{{ $t('noMessagesFoundMessage') }}</div>
        <div class="marginalizedContent keyRefillInfoBox" v-if="keyAlmostEmpty">
          <div class="infoText">
            <template v-if="keyEmpty">{{ $t('keyEmptyMessage') }}</template>
            <template v-else>{{ $t('keyAlmostEmptyMessage') }}</template>
            &ndash;<br>
            {{ $t('refillKeyMessage') }}
          </div>
          <v-ons-button modifier="large" @click="refillKey">{{ $t('refill') }} 🔑</v-ons-button>
        </div>
      </p>
    </div>
    <div class="buffer" v-if="showBuffer"></div>
    <v-ons-bottom-toolbar>
      <textarea class="textarea" v-model="message" autocomplete="off"></textarea>
      <v-ons-button modifier="quiet" class="sendButton" @click="sendMessage" :disabled="message.trim().length <= 0 || !otpCryptoResult.isKeyLongEnough || !sendButtonEnabled || !chat.otherId">{{ $t('send') }}</v-ons-button>
    </v-ons-bottom-toolbar>
    <v-ons-dialog cancelable :visible.sync="informationDialogVisible">
      <p><b class="chatName">{{chat.name}}</b> <v-ons-icon @click="newChatName = chat.name; showEditNameDialog = true" icon="ion-ios-create, material:ion-md-create" class="editIcon" :aria-label="$t('editName')"></v-ons-icon></p>
      <p class="selectable" v-if="$global.state.debugMode">{{ $t('id') }}: <b><i v-if="chat.otherId == null">{{ $t('unknown') }}</i><span v-if="chat.otherId != null">{{chat.otherId}}</span></b></p>
      <p class="selectable">{{ $t('ownKey') }}:<br>{{ $t('size') }}: <b>{{ownKey.length}}</b>, {{ $t('checksum') }}: <b>{{calculateByteArrayChecksum(ownKey)}}</b></p>
      <p class="selectable">{{ $t('otherKey') }}:<br>{{ $t('size') }}: <b>{{otherKey.length}}</b>, {{ $t('checksum') }}: <b>{{calculateByteArrayChecksum(otherKey)}}</b></p>
      <p><v-ons-button @click="deleteAllMessages()" v-show="chat.messages.length > 0">{{ $t('deleteChatHistory') }}</v-ons-button></p>
    </v-ons-dialog>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="showEditNameDialog">
      <span slot="title">{{ $t('editName') }}</span>
      <p>
        <v-ons-input type="text" modifier="underbar" :placeholder="$t('chatNamePlaceholder')" float v-model="newChatName"></v-ons-input>
      </p>
      <template slot="footer">
        <div class="alert-dialog-button" @click="showEditNameDialog = false; newChatName = '';">{{ $t('cancel') }}</div>
        <div class="alert-dialog-button" @click="saveChatName(newChatName);"><b>{{ $t('save') }}</b></div>
      </template>
    </v-ons-alert-dialog>
    <v-ons-progress-circular indeterminate v-show="showLoadingIndicator"></v-ons-progress-circular>
  </v-ons-page>
</template>

<script>
import OtpCrypto from 'otp-crypto'
import RefillKeyActive from './RefillKeyActive'
import RefillKeyPassive from './RefillKeyPassive'

const keyAlmostEmptyThreshold = 100

export default {
  name: 'chat',
  data () {
    return {
      searchText: '',
      sendButtonEnabled: true,
      showLoadingIndicator: false,
      informationDialogVisible: false,
      showEditNameDialog: false,
      newChatName: '',
      showBuffer: false,
    }
  },
  created () {
    setTimeout(() => {
      this.showBuffer = true // To trigger v-chat-scroll to scroll to bottom on initial load
    })
  },
  computed: {
    chat () {
      return this.$store.getters.currentChat
    },
    message: {
      get () {
        return this.$store.getters.currentChat.message
      },
      set (value) {
        this.$store.commit('updateMessage', value)
      }
    },
    filteredMessages () {
      return this.chat.messages
        .filter(message => message.text.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
        .map(message => {
          const tempDiv = document.createElement('div')
          tempDiv.appendChild(document.createTextNode(message.text))
          message.textHtmlEscaped = tempDiv.innerHTML
          message.html = tempDiv.innerHTML
            .replace(/\n/g, ' <br> ')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
          return message
        })
    },
    ownKey () {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.chat.ownKey)
    },
    otherKey () {
      return OtpCrypto.encryptedDataConverter.base64ToBytes(this.chat.otherKey)
    },
    keyAlmostEmpty () {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.ownKey).remainingKey.length - keyAlmostEmptyThreshold < 0
    },
    keyEmpty () {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.ownKey).remainingKey.length <= 0
    },
    otpCryptoResult () {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE + this.message, this.ownKey)
    },
    otpCryptoResultWithoutPreamble () {
      return OtpCrypto.encrypt(this.message, this.ownKey)
    },
  },
  methods: {
    saveChatName (name) {
      if (name.trim() === '') {
        this.$ons.notification.toast(this.$t('enterChatNameMessage'), { timeout: 3000 })
        return
      }
      this.$store.commit('setChatName', {
        id: this.chat.id,
        name: name,
      })
      this.showEditNameDialog = false
      this.newChatName = this.chat.name
    },
    deleteAllMessages () {
      this.$ons.openActionSheet({ buttons: [this.$t('deleteAllMessagesLocally'), this.$t('cancel')], title: this.$t('deleteAllMessagesLocallyTitle'), cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteAllMessages', this.chat.id)
        }
      })
    },
    dateTimeText (timestamp) {
      const humanDate = this.humanizeDate(timestamp)
      return humanDate.isToday ? humanDate.timeText : `${humanDate.dateText}, ${humanDate.timeText}`
    },
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: [this.$t('deleteMessageLocally'), this.$t('cancel')], title: message.textHtmlEscaped, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteMessage', message.id)
        }
      })
    },
    async sendMessage () {
      if (!this.otpCryptoResult.isKeyLongEnough) {
        this.$ons.notification.toast(this.$t('keyNotLongEnough'), { timeout: 1000 })
        return
      }
      if (!this.chat.otherId) {
        this.$ons.notification.toast(this.$t('otherIdNotSet'), { timeout: 1000 })
        return
      }
      const requestBody = {
        sender: this.$store.state.id,
        receiver: this.chat.otherId,
        payload: this.otpCryptoResult.base64Encrypted
      }
      this.sendButtonEnabled = false
      try {
        const response = await this.$http.post('messages', requestBody, { timeout: 5000 })
        this.chat.messages.push({
          id: `${response.body.sender}${response.body.timestamp}`,
          own: true,
          text: this.message,
          timestamp: response.body.timestamp
        })
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(this.otpCryptoResult.remainingKey))
        this.message = ''
      } catch (error) {
        switch (error.status) {
          case 0:
            this.$ons.notification.toast(this.$t('networkError'), { timeout: 3000 })
            break
          default:
            this.handleUnexpectedError(error)
        }
      } finally {
        this.sendButtonEnabled = true
      }
    },
    refillKey () {
      this.$ons.openActionSheet({buttons: [this.$t('iShowTheQrCodes'), this.$t('iScanTheQrCodes'), this.$t('cancel')], title: this.$t('whatIsYourPart'), cancelable: true}).then(response => {
        switch (response) {
          case 0:
            this.$emit('push-page', RefillKeyPassive)
            break
          case 1:
            this.$emit('push-page', {
              extends: RefillKeyActive,
              onsNavigatorProps: {
                sendMessageCallback: () => {
                  this.message = this.$t('helloChatMessage', { name: this.chat.name })
                },
              },
            })
            break
        }
      })
    },
    calculateByteArrayChecksum (bytes) {
      let checksum = 0
      bytes.forEach(byte => { checksum ^= byte })
      return checksum
    }
  }
}
</script>

<style scoped>
  .negative {
    color: red;
  }
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
    margin-bottom: 15px;
  }
  .infoText {
    margin-bottom: 15px;
  }
  ons-progress-circular {
    position: fixed;
    top: 75%;
    left: 50%;
    transform: translate(-50%);
  }
  .dialog-container > * {
    text-align: center;
    margin: 16px;
  }
  .dialog-container .chatName {
    overflow-wrap: anywhere;
  }
  .dialog-container .editIcon {
    vertical-align: baseline;
  }
</style>
