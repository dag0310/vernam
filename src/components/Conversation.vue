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
      <div v-for="message in filteredMessages" :key="message.id">
        <div class="card" :class="{ownMessage: message.own}">
          <div class="card__content">
            <span class="messageText">{{ message.text }}</span>
            <br>
            <span class="messageInfo">
              <span class="messageInfoDate">{{ message.dateText }}, {{ message.timeText }}</span>
              <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click="deleteMessage(message)"></ons-icon>
              <ons-icon icon="ion-ios-checkmark-empty" class="list-item__icon" :style="{color: message.sent ? 'green' : 'transparent'}"></ons-icon>
            </span>
            <div class="clearfix"></div>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
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
      conversation: this.$store.state.conversations.find(conversation => conversation.id === this.$store.state.currentConversationId),
      searchText: ''
    }
  },
  computed: {
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
      return !this.conversation.message
    },
    keyEmpty () {
      return this.conversation.ownKey.length === 0
    },
    approxWordsLeftToSend () {
      return Math.round(this.conversation.ownKey.length / approxBytesPerWord)
    }
  },
  methods: {
    deleteMessage (message) {
      this.$ons.openActionSheet({ buttons: ['Delete message', 'Cancel'], title: message.text, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.conversation.messages.splice(this.conversation.messages.findIndex(m => m === message), 1)
        }
      })
    },
    sendMessage () {
      const payload = this.conversation.message

      this.$http.post('messages', {receiver: this.conversation.id, payload}).then(response => {
        this.conversation.messages.push({
          id: response.body.id,
          own: true,
          text: response.body.payload,
          timestamp: response.body.timestamp,
          sent: true
        })
        this.conversation.message = undefined
      }, response => {
        this.$ons.notification.alert('Message could not be sent!')
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
  .keyEmpty {
    text-align: center;
    margin: 25px 0 15px;
  }
  .keyEmpty .infoText {
    margin-bottom: 5px;
  }
</style>
