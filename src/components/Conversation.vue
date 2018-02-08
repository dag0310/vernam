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
      <v-ons-list v-show="filteredMessages.length > 0">
        <v-ons-list-item v-for="message in filteredMessages" :key="message.id">
          <div class="center">
            <span class="list-item__title ellipsis">{{ nameOfSender(message.senderId) }}:</span>
            <span class="list-item__subtitle">{{ message.text }}</span>
          </div>
          <div class="right">
            <span class="list-item__label" v-html="formattedDateTime(message.timestamp)"></span>
            <ons-icon icon="ion-ios-checkmark-empty" class="list-item__icon" :style="{color: message.sent ? 'green' : 'transparent'}"></ons-icon>
            <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click="deleteMessage(message)"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0">
        No messages found
      </div>
      <div class="marginalizedContent keyEmpty" v-if="keyEmpty">
        <div class="infoText">Your key is empty &ndash;<br>Please refill it to send more messages.</div>
        <v-ons-button modifier="large" @click="refillKey">Refill 🔑</v-ons-button>
      </div>
      <div class="buffer"></div>
    </div>
    <v-ons-bottom-toolbar>
      <textarea class="textarea" v-model="conversation.message"></textarea>
      <v-ons-button modifier="quiet" class="sendButton" @click="sendMessage" :disabled="messageEmpty || keyEmpty">Send</v-ons-button>
    </v-ons-bottom-toolbar>
  </v-ons-page>
</template>

<script>
const approxBytesPerWord = 5

export default {
  name: 'conversation',
  data () {
    return {
      conversation: this.$store.state.global.currentConversation,
      searchText: ''
    }
  },
  computed: {
    filteredMessages () {
      return this.conversation.messages
        .filter(message => message.text.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => a.timestamp - b.timestamp)
    },
    messageEmpty () {
      return !this.conversation.message
    },
    keyEmpty () {
      return this.conversation.key.length === 0
    },
    approxWordsLeftToSend () {
      return Math.round(this.conversation.key.length / approxBytesPerWord)
    }
  },
  methods: {
    nameOfSender (senderId) {
      return (senderId === -1) ? 'You' : 'They'
    },
    formattedDateTime (timestamp) {
      let timestampDate = new Date(timestamp)
      const dateStr = timestampDate.getFullYear() + '-' +
        ('' + (timestampDate.getMonth() + 1)).padStart(2, '0') + '-' +
        ('' + (timestampDate.getDate())).padStart(2, '0')
      const timeStr = ('' + (timestampDate.getHours())).padStart(2, '0') + ':' + ('' + (timestampDate.getMinutes())).padStart(2, '0')
      return [dateStr, timeStr].join('<br>')
    },
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: ['Delete message', 'Cancel'], title: message.text, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.conversation.messages.splice(this.conversation.messages.findIndex(m => m === message), 1)
        }
      })
    },
    sendMessage () {
      // TODO: Implement send message feature
      this.conversation.messages.push({
        id: null,
        senderId: -1,
        text: this.conversation.message || '',
        timestamp: Date.now(),
        sent: false
      })
      this.conversation.message = undefined
    },
    refillKey () {
      this.$ons.notification.toast('TODO: Refill key', { timeout: 1000 })
    }
  }
}
</script>

<style scoped>
  .list-item__subtitle {
    max-width: 180px;
    word-wrap: break-word;
  }
  .list-item__label {
    font-size: 10px;
    text-align: right;
    overflow: visible;
    white-space: nowrap;
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
  .keyEmpty {
    text-align: center;
    margin: 25px 0 15px;
  }
  .keyEmpty .infoText {
    margin-bottom: 5px;
  }
</style>
