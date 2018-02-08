<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center ellipsis">{{ conversation.name }}</div>
    </v-ons-toolbar>
    <div class="content">
      --- Conversation goes here ---
    </div>
  </v-ons-page>
</template>

<script>
export default {
  name: 'conversation',
  data () {
    return {
      conversation: this.$store.state.global.currentConversation
    }
  }
}
</script>
