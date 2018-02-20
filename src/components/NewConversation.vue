<template>
  <v-ons-page id="newconversation">
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center">New conversation</div>
      <div class="right"></div>
    </v-ons-toolbar>
    <div class="content">
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input placeholder="Search" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
      </p>
      <v-ons-list v-show="filteredContacts.length > 0">
        <v-ons-list-item v-for="contact in filteredContacts" :key="contact.id" tappable @click="createConversation(contact)">
          <div class="center">
            <span class="list-item__title ellipsis">{{ contact.name }}</span>
            <span class="list-item__subtitle ellipsis"> </span>
          </div>
          <div class="right">
            <ons-icon icon="ion-ios-arrow-forward" class="list-item__icon"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredContacts.length <= 0">
        No contacts found
      </div>
    </div>
  </v-ons-page>
</template>

<script>
import Conversation from './Conversation'

export default {
  name: 'newconversation',
  data () {
    return {
      searchText: '',
      contacts: []
    }
  },
  created () {
    this.contacts.push({name: 'Contact 1', number: '111'}, {name: 'Contact 2', number: '222'})
  },
  computed: {
    filteredContacts () {
      return this.contacts.filter(contact => contact.name.toUpperCase().includes(this.searchText.toUpperCase()))
    }
  },
  methods: {
    createConversation (contact) {
      const id = contact.number

      if (this.$store.state.conversations.every(conversation => conversation.id !== id)) {
        this.$store.commit('createConversation', {
          id: id,
          name: contact.name,
          messages: [],
          message: '',
          newMessages: false,
          ownKey: '',
          otherKey: ''
        })
      }
      this.$store.commit('setCurrentConversationId', id)
      this.$emit('replace-page', Conversation)
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
