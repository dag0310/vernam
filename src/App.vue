<template>
  <v-ons-page id="app">
    <home-page></home-page>
  </v-ons-page>
</template>

<script>
import HomePage from './components/HomePage'

export default {
  name: 'app',
  computed: {
  },
  components: {
    HomePage
  }
}
</script>

<style scoped>

</style>
