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
        <v-ons-list-header>Information</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            Phone number: {{ $store.state.id }}
          </div>
        </v-ons-list-item>
        <v-ons-list-header>Danger zone</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="resetAppData()">Reset app data</v-ons-button>
          </div>
        </v-ons-list-item>
        <v-ons-list-header>Copyright</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            © 2018 Vernam, Daniel Geymayer
          </div>
        </v-ons-list-item>
      </v-ons-list>
    </div>
  </v-ons-page>
</template>

<script>
export default {
  name: 'settings',
  methods: {
    resetAppData () {
      this.$ons.openActionSheet({ buttons: ['Reset app data', 'Cancel'], title: 'Deletes all conversations and their keys.', cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          window.localStorage.clear()
          window.location.reload()
        }
      })
    }
  }
}
</script>
