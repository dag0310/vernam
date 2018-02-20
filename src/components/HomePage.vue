<template>
  <v-ons-page id="home">
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="showSettingsPage">
          <v-ons-icon icon="ion-ios-gear, material:md-settings"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">Conversations</div>
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
            <span class="list-item__title ellipsis" :class="{bold: conversation.newMessages}">{{ conversation.name }}</span>
            <span class="list-item__subtitle ellipsis" :class="{bold: conversation.newMessages}">
              {{ lastMessageText(conversation) }}
            </span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ lastMessageDateText(conversation) }}</span>
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
      searchText: ''
    }
  },
  created () {
    const self = this
    document.addEventListener('show', function (event) {
      if (event.target.matches('#home')) {
        self.$store.commit('setCurrentConversationId', null)
      }
    }, false)
  },
  computed: {
    conversations () {
      return this.$store.state.conversations
    },
    filteredConversations () {
      return this.conversations
        .filter(conversation => conversation.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => {
          const lastMessageA = this.lastMessage(a)
          const lastMessageB = this.lastMessage(b)

          if (!lastMessageA && !lastMessageB) {
            return 0
          }
          if (!lastMessageA) {
            return 1
          }
          if (!lastMessageB) {
            return -1
          }

          return lastMessageB.timestamp - lastMessageA.timestamp
        })
    }
  },
  methods: {
    lastMessage (conversation) {
      const messages = JSON.parse(JSON.stringify(conversation.messages)) // Avoids infinite loop in render function
      return (messages.length > 0) ? messages.sort((a, b) => b.timestamp - a.timestamp)[0] : null
    },
    lastMessageText (conversation) {
      const lastMessage = this.lastMessage(conversation)
      return lastMessage ? lastMessage.text : ''
    },
    lastMessageDateText (conversation) {
      const lastMessage = this.lastMessage(conversation)
      if (lastMessage !== null) {
        const humanDate = this.humanDate(lastMessage.timestamp)
        return humanDate.isToday ? humanDate.timeText : humanDate.dateText
      }
      return ''
    },
    showSettingsPage () {
      this.$emit('push-page', Settings)
    },
    showConversationPage (conversation) {
      this.$store.commit('setNewMessagesFalse', conversation.id)
      this.$store.commit('setCurrentConversationId', conversation.id)
      this.$emit('push-page', Conversation)
    },
    deleteConversation (conversation) {
      this.$ons.openActionSheet({ buttons: ['Delete conversation', 'Cancel'], title: conversation.name, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteConversation', conversation.id)
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
