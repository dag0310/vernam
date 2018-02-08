<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-back-button>Back</v-ons-back-button>
      </div>
      <div class="center">{{ title }}</div>
    </v-ons-toolbar>
    <div class="content">
      <v-ons-list>
        <v-ons-list-item>
          <div class="center">
            (c) 2018 Vernam, Daniel Geymayer
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
      title: 'Settings'
    }
  }
}
</script>
