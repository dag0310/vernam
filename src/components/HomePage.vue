<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="showSettingsPage">
          <v-ons-icon icon="ion-ios-gear, material:md-settings"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">{{ title }}</div>
<!--
      <div class="right">
        <v-ons-toolbar-button @click="">
          <v-ons-icon icon="ion-ios-compose-outline"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
-->
    </v-ons-toolbar>
    <div class="content">
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input placeholder="Search" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
      </p>
      <v-ons-list v-show="filteredConversations.length > 0">
        <v-ons-list-item v-for="conversation in filteredConversations" :key="conversation.id" tappable @click="showConversationPage(conversation)">
          <div class="center">
            <span class="list-item__title ellipsis">{{ conversation.name }}</span>
            <span class="list-item__subtitle ellipsis">{{ conversation.lastMessage ? conversation.lastMessage.text : '' }}</span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ conversation.lastMessage ? conversation.lastMessage.dateText : '' }}</span>
            <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click.stop="deleteConversation(conversation)"></ons-icon>
            <ons-icon icon="ion-ios-arrow-forward" class="list-item__icon"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredConversations.length <= 0">
        No conversations found
      </div>
    </div>
  </v-ons-page>
</template>

<script>
import Settings from './Settings'
import Conversation from './Conversation'

export default {
  name: 'home',
  data () {
    return {
      title: 'Conversations',
      searchText: '',
      conversations: this.$store.state.global.conversations
    }
  },
  computed: {
    conversationsWithLastMessage () {
      const convertToHumanDate = timestamp => {
        const date = new Date(timestamp)
        const now = new Date()
        const todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
        const dayInMs = 3600000 * 24
        const timeText = ('' + (date.getHours())).padStart(2, '0') + ':' + ('' + (date.getMinutes())).padStart(2, '0')
        let isToday, dateText

        if (timestamp >= todayAtMidnightTimestamp) {
          isToday = true
          dateText = 'Today'
        } else if (timestamp >= todayAtMidnightTimestamp - dayInMs) {
          isToday = false
          dateText = 'Yesterday'
        } else if (timestamp >= todayAtMidnightTimestamp - dayInMs * 6) {
          isToday = false
          dateText = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
        } else {
          isToday = false
          dateText = date.getFullYear() + '-' +
            ('' + (date.getMonth() + 1)).padStart(2, '0') + '-' +
            ('' + (date.getDate())).padStart(2, '0')
        }

        return { isToday, dateText, timeText }
      }

      return this.conversations.map(conversation => {
        conversation.lastMessage = (conversation.messages.length > 0) ? conversation.messages.sort((a, b) => b.timestamp - a.timestamp)[0] : null
        const humanDate = convertToHumanDate(conversation.lastMessage.timestamp)
        conversation.lastMessage.dateText = humanDate.isToday ? humanDate.timeText : humanDate.dateText
        return conversation
      })
    },
    filteredConversations () {
      return this.conversationsWithLastMessage
        .filter(conversation => conversation.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) {
            return 0
          }
          if (!a.lastMessage) {
            return 1
          }
          if (!b.lastMessage) {
            return -1
          }
          return b.lastMessage.timestamp - a.lastMessage.timestamp
        })
    }
  },
  methods: {
    showSettingsPage () {
      this.$emit('push-page', Settings)
    },
    showConversationPage (conversation) {
      this.$store.state.global.currentConversation = conversation
      this.$emit('push-page', Conversation)
    },
    deleteConversation (conversation) {
      this.$ons.openActionSheet({ buttons: ['Delete conversation', 'Cancel'], title: conversation.name, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.conversations.splice(this.conversations.findIndex(c => c === conversation), 1)
        }
      })
    }
  }
}
</script>

<style scoped>
  .list-item__subtitle {
    width: 150px;
  }
  .list-item__label {
    font-size: 12px;
    overflow: visible;
    white-space: nowrap;
  }
  .list-item__icon.ion-ios-arrow-forward {
    color: #c7c7cc;
    font-size: 20px;
  }
</style>
