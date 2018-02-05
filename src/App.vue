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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ons-splitter-side[side=left][animation=overlay] {
  border-right: 1px solid #BBB;
}
</style>
