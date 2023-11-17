<template>
  <v-ons-page id="home">
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="showSettingsPage">
          <v-ons-icon icon="ion-ios-cog, material:ion-md-cog"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">Chats</div>
      <div class="right">
        <v-ons-toolbar-button @click="showCreateChatDialog = true">
          <v-ons-icon icon="ion-ios-create, material:ion-md-create"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content">
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input placeholder="Search" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
      </p>
      <v-ons-list v-show="filteredChats.length > 0">
        <v-ons-list-item v-for="chat in filteredChats" :key="chat.id" tappable @click="showChatPage(chat)">
          <div class="center">
            <span class="list-item__title ellipsis" :class="{bold: chat.newMessages}">{{ chat.name }}</span>
            <span class="list-item__subtitle ellipsis" :class="{bold: chat.newMessages}">
              <template v-if="chat.message.length > 0"><i>Draft: </i>{{ chat.message }}</template>
              <template v-else>
                <i v-if="lastMessageIsOwn(chat)">You: </i>
                {{ lastMessageText(chat) }}
              </template>
            </span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ lastMessageDateText(chat) }}</span>
            <ons-icon icon="ion-ios-trash, material:ion-md-trash" class="list-item__icon" @click.stop="deleteChat(chat)"></ons-icon>
            <ons-icon icon="ion-ios-arrow-forward, material:ion-md-arrow-forward" class="list-item__icon"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredChats.length <= 0">No chats found</div>
    </div>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="showCreateChatDialog">
      <span slot="title">New chat</span>
      <p>
        <v-ons-input type="text" modifier="underbar" placeholder="Chat name ..." float v-model="newChatName"></v-ons-input>
      </p>
      <template slot="footer">
        <div class="alert-dialog-button" @click="showCreateChatDialog = false; newChatName = '';">Cancel</div>
        <div class="alert-dialog-button" @click="createChat(newChatName);"><b>OK</b></div>
      </template>
    </v-ons-alert-dialog>
  </v-ons-page>
</template>

<script>
import Settings from './Settings'
import Chat from './Chat'

import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'home',
  data () {
    return {
      searchText: '',
      showCreateChatDialog: false,
      newChatName: '',
    }
  },
  created () {
    if (this.$store.state.id === null) {
      this.$store.commit('setId', uuidv4())
    }

    document.addEventListener('show', event => {
      if (event.target.matches('#home')) {
        this.$store.commit('setCurrentChatId', null)
      }
    }, false)
  },
  computed: {
    chats () {
      return this.$store.state.chats
    },
    filteredChats () {
      return this.chats
        .filter(chat => chat.name.toUpperCase().includes(this.searchText.toUpperCase()))
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
    lastMessage (chat) {
      const messages = JSON.parse(JSON.stringify(chat.messages)) // Avoids infinite loop in render function
      return (messages.length > 0) ? messages.sort((a, b) => b.timestamp - a.timestamp)[0] : null
    },
    lastMessageText (chat) {
      const lastMessage = this.lastMessage(chat)
      return lastMessage ? lastMessage.text : ''
    },
    lastMessageIsOwn (chat) {
      const lastMessage = this.lastMessage(chat)
      return lastMessage ? lastMessage.own : false
    },
    lastMessageDateText (chat) {
      const lastMessage = this.lastMessage(chat)
      if (lastMessage !== null) {
        const humanDate = this.humanDate(lastMessage.timestamp)
        return humanDate.isToday ? humanDate.timeText : humanDate.dateText
      }
      return ''
    },
    showSettingsPage () {
      this.$emit('push-page', Settings)
    },
    showChatPage (chat) {
      this.$store.commit('setNewMessagesFalse', chat.id)
      this.$store.commit('setCurrentChatId', chat.id)
      this.$emit('push-page', Chat)
    },
    deleteChat (chat) {
      this.$ons.openActionSheet({ buttons: ['Delete chat locally', 'Cancel'], title: chat.name, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteChat', chat.id)
        }
      })
    },
    createChat (name) {
      if (name.trim() === '') {
        return
      }
      const newChatId = uuidv4()
      this.$store.commit('createChat', {
        id: newChatId,
        otherId: null,
        name: name,
        messages: [],
        message: '',
        newMessages: false,
        ownKey: '',
        otherKey: '',
      })
      this.$store.commit('setCurrentChatId', newChatId)
      this.$emit('push-page', Chat)
      this.showCreateChatDialog = false
      this.newChatName = ''
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
