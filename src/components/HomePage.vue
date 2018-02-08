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
        <v-ons-search-input placeholder="Search" v-model="searchText" class=""></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''">×</span>
      </p>
      <v-ons-list v-if="filteredConversations.length > 0">
        <v-ons-list-item v-for="item in filteredConversations" :key="item.id" tappable @click="showConversationPage(item)">
          <div class="center">
            <span class="list-item__title ellipsis">{{ item.name }}</span>
            <span class="list-item__subtitle ellipsis">{{ item.lastMessage }}</span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ humanReadableTimestamp(item.lastTimestamp) }}</span>
            <ons-icon icon="ion-ios-arrow-forward" class="list-item__icon"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-if="filteredConversations.length <= 0">
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
    filteredConversations () {
      return this.conversations
        .filter(item => item.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
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
    weekDay (index) {
      let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return weekDays[index]
    },
    humanReadableTimestamp (timestamp) {
      let timestampDate = new Date(timestamp)
      let now = new Date()
      let todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
      let dayInMs = 3600000 * 24

      if (timestamp >= todayAtMidnightTimestamp) {
        return ('' + (timestampDate.getHours())).padStart(2, '0') + ':' + ('' + (timestampDate.getMinutes())).padStart(2, '0')
      }

      if (timestamp >= todayAtMidnightTimestamp - dayInMs) {
        return 'Yesterday'
      }

      if (timestamp >= todayAtMidnightTimestamp - dayInMs * 6) {
        return this.weekDay(timestampDate.getDay())
      }

      return timestampDate.getFullYear() + '-' +
        ('' + (timestampDate.getMonth() + 1)).padStart(2, '0') + '-' +
        ('' + (timestampDate.getDate())).padStart(2, '0')
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
  .list-item__icon {
    color: #c7c7cc;
    font-size: 20px;
  }
</style>
