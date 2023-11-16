<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center">Settings</div>
    </v-ons-toolbar>
    <div class="content">
      <v-ons-list>
        <v-ons-list-header>ID</v-ons-list-header>
        <v-ons-list-item>
          <div class="center" style="user-select: auto;">
            {{ $store.state.id }}
          </div>
        </v-ons-list-item>
        <v-ons-list-header>Danger zone</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="resetData()" style="background-color: red;">Reset local data</v-ons-button>
          </div>
        </v-ons-list-item>
        <v-ons-list-header>About</v-ons-list-header>
        <v-ons-list-item>
          <div class="center" style="user-select: auto;">
            © 2018, 2023 Daniel Geymayer<br>
            Build: {{ buildTimestamp }}
          </div>
        </v-ons-list-item>
      </v-ons-list>
    </div>
  </v-ons-page>
</template>

<script>
export default {
  name: 'settings',
  data () {
    return {
      // BUILD_TIMESTAMP will be injected during build process, not available during development, which is OK
      buildTimestamp: BUILD_TIMESTAMP, // eslint-disable-line
    }
  },
  methods: {
    resetData () {
      this.$ons.openActionSheet({ buttons: ['Reset local data', 'Cancel'], title: 'Deletes own ID, all conversations and keys.', cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          window.localStorage.clear()
          window.location.reload()
        }
      })
    }
  }
}
</script>
