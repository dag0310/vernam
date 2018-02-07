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

<style>
  .searchContainer {
    position: relative;
  }
  .searchContainer ons-search-input {
    margin: 0 15px;
    width: calc(100% - 30px);
  }
  .searchContainer ons-search-input .search-input {
    padding-right: 30px;
  }
  .searchContainer .clearSearch {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    padding: 5px 10px;
    cursor: pointer;
    color: gray;
  }
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
