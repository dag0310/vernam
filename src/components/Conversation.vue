<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center ellipsis">{{ conversation.name }}</div>
    </v-ons-toolbar>
    <div class="content">
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
            <ons-icon icon="ion-ios-checkmark-empty" class="list-item__icon" v-if="message.sent"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredMessages.length <= 0">
        No messages found
      </div>
    </div>
  </v-ons-page>
</template>

<script>
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
    }
  }
}
</script>

<style scoped>
  .list-item__subtitle {
    max-width: 300px;
  }
  .list-item__label {
    font-size: 10px;
    text-align: right;
    overflow: visible;
    white-space: nowrap;
  }
  .list-item__icon {
    color: green;
  }
</style>
