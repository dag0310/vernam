<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>{{ $t('back') }}</v-ons-back-button>
      </div>
      <div class="center ellipsis" @click="informationDialogVisible = true">{{ chat.name }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="refillKey">
          <template v-if="keyEmpty">{{ $t('refillShort') }} 🔑</template>
          <template v-else>🔑 {{ remainingKeyLength }}</template>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content" v-chat-scroll="{ always: true, smooth: false, scrollonremoved: true }">
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input :placeholder="$t('searchbarPlaceholder')" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
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
      <div class="marginalizedContent infoText" v-show="chat.otherId == null && !keyEmpty">{{ $t('noOtherIdMessage') }}</div>
      <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0">{{ $t('noMessagesFoundMessage') }}</div>
      <div class="marginalizedContent keyRefillInfoBox" v-if="keyAlmostEmpty">
        <div class="infoText">
          <template v-if="keyEmpty">{{ $t('keyEmptyMessage') }}</template>
          <template v-else>{{ $t('keyAlmostEmptyMessage') }}</template>
          &ndash;<br>
          {{ $t('refillKeyMessage') }}
        </div>
        <v-ons-button modifier="large" @click="refillKey">{{ $t('refill') }} 🔑</v-ons-button>
      </div>
      <div class="buffer" v-if="showBuffer"></div>
    </div>
    <v-ons-bottom-toolbar>
      <textarea class="textarea" v-model="message" autocomplete="off"></textarea>
      <v-ons-button modifier="quiet" class="sendButton" @click="sendMessage" :disabled="!message || !otpCryptoResult.isKeyLongEnough || !sendButtonEnabled || !chat.otherId">{{ $t('send') }}</v-ons-button>
    </v-ons-bottom-toolbar>
    <v-ons-dialog cancelable :visible.sync="informationDialogVisible">
      <p>{{ $t('name') }}: <b>{{chat.name}}</b> <v-ons-icon @click="newChatName = chat.name; showEditNameDialog = true" icon="ion-ios-create, material:ion-md-create" :aria-label="$t('editName')"></v-ons-icon></p>
      <p class="selectable">{{ $t('ownKey') }}:<br>{{ $t('size') }}: <b>{{ownKey.length}}</b>, {{ $t('checksum') }}: <b>{{calculateByteArrayChecksum(ownKey)}}</b></p>
      <p class="selectable">{{ $t('otherKey') }}:<br>{{ $t('size') }}: <b>{{otherKey.length}}</b>, {{ $t('checksum') }}: <b>{{calculateByteArrayChecksum(otherKey)}}</b></p>
      <p class="selectable">{{ $t('otherId') }}:<br><b><i v-if="chat.otherId == null">{{ $t('unknown') }}</i><span v-if="chat.otherId != null">{{chat.otherId}}</span></b></p>
    </v-ons-dialog>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="showEditNameDialog">
      <span slot="title">{{ $t('editName') }}</span>
      <p>
        <v-ons-input type="text" modifier="underbar" :placeholder="$t('chatNamePlaceholder') + ' ...'" float v-model="newChatName"></v-ons-input>
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
    // FIXME: Temporary: Fixes old messages where the timestamp was retrieved from backend as string instead of number
    for (const message of this.chat.messages) {
      if (typeof message.timestamp === 'string') {
        message.timestamp = parseInt(message.timestamp, 10)
        this.$store.commit('updateMessage', message)
      }
    }
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
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE + 'V'.repeat(keyAlmostEmptyThreshold), this.ownKey).remainingKey.length <= 0
    },
    keyEmpty () {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE, this.ownKey).remainingKey.length <= 0
    },
    otpCryptoResult () {
      return OtpCrypto.encrypt(this.AUTH_PREAMBLE + this.message, this.ownKey)
    },
    remainingKeyLength () {
      return this.otpCryptoResult.isKeyLongEnough ? this.otpCryptoResult.remainingKey.length : 'X'
    }
  },
  methods: {
    saveChatName (name) {
      if (name.trim() === '') {
        return
      }
      this.$store.commit('setChatName', {
        id: this.chat.id,
        name: name,
      })
      this.showEditNameDialog = false
      this.newChatName = this.chat.name
    },
    dateTimeText (timestamp) {
      const humanDate = this.humanDate(timestamp)
      return humanDate.isToday ? humanDate.timeText : `${humanDate.dateText}, ${humanDate.timeText}`
    },
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: [this.$t('deleteMessageLocally'), this.$t('cancel')], title: message.textHtmlEscaped, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteMessage', message.id)
        }
      })
    },
    sendMessage () {
      if (!this.otpCryptoResult.isKeyLongEnough) {
        this.$ons.notification.toast(this.$t('keyNotLongEnough'), { timeout: 1000 })
        return
      }
      if (!this.chat.otherId) {
        this.$ons.notification.toast(this.$t('otherIdNotSet'), { timeout: 1000 })
        return
      }
      this.sendButtonEnabled = false
      this.$http.post('messages', {
        sender: this.$store.state.id,
        receiver: this.chat.otherId,
        payload: this.otpCryptoResult.base64Encrypted
      }, { timeout: 5000 }).then(response => {
        const message = response.body
        this.chat.messages.push({
          id: `${message.sender}${message.timestamp}`,
          own: true,
          text: this.message,
          timestamp: message.timestamp
        })
        this.$store.commit('updateOwnKey', OtpCrypto.encryptedDataConverter.bytesToBase64(this.otpCryptoResult.remainingKey))
        this.message = ''
      }, response => {
        this.$ons.notification.toast(this.$t('messageCouldNotBeSent'), { timeout: 1000 })
      }).then(() => {
        this.sendButtonEnabled = true
      })
    },
    refillKey () {
      this.$ons.openActionSheet({buttons: [this.$t('iScanTheQrCodes'), this.$t('iShowTheQrCodes'), this.$t('cancel')], title: this.$t('whatIsYourPart'), cancelable: true}).then(response => {
        if (response === 0) {
          this.$emit('push-page', {
            extends: RefillKeyActive,
            onsNavigatorProps: {
              sendMessageCallback: () => {
                this.message = this.$t('helloChatMessage', { name: this.chat.name })
              },
            },
          })
        } else if (response === 1) {
          this.$emit('push-page', RefillKeyPassive)
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
  }
</style>
