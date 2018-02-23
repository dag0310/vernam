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
        <v-ons-list-header>Copyright</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            © 2018 Vernam, Daniel Geymayer
          </div>
        </v-ons-list-item>
        <v-ons-list-header>Set identity</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="setIdentity('+436801234567')">Daniel Geymayer</v-ons-button>
          </div>
        </v-ons-list-item>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="setIdentity('+436641234567')">John Doe</v-ons-button>
          </div>
        </v-ons-list-item>
        <v-ons-list-header>Danger zone</v-ons-list-header>
        <v-ons-list-item>
          <div class="center">
            <v-ons-button modifier="large" @click="resetAppData()">Reset app data</v-ons-button>
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
    setIdentity (id, authToken) {
      this.$store.commit('setId', id)
      window.location.reload()
    },
    resetAppData () {
      this.$ons.openActionSheet({ buttons: ['Reset app data', 'Cancel'], title: 'This will also delete all your keys.', cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          window.localStorage.clear()
          window.location.reload()
        }
      })
    }
  }
}
</script>
