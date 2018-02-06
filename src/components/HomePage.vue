<template>
  <v-ons-page>
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="">
          <v-ons-icon icon="ion-ios-gear, material:md-settings"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">{{ title }}</div>
      <div class="right">
        <v-ons-toolbar-button @click="">
          <v-ons-icon icon="ion-ios-compose-outline"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>

    <p>
      <v-ons-search-input class="center" placeholder="Search" v-model="searchText"></v-ons-search-input>
    </p>
    
    <v-ons-list>
      <v-ons-list-item v-for="item in filteredConversations" modifier="chevron" tappable @tap="" :key="item.id">
        <div class="center">
          <span class="list-item__title ellipsis">{{ item.name }}</span>
          <span class="list-item__subtitle ellipsis">{{ item.lastMessage }}</span>
        </div>
        <div class="right chevron-text">
          {{ humanReadableTimestamp(item.lastTimestamp) }}
        </div>
      </v-ons-list-item>
    </v-ons-list>
  </v-ons-page>
</template>

<script>
export default {
  name: 'home',
  data () {
    return {
      title: 'Conversations',
      searchText: '',
      conversations: [
        {
          id: 1,
          name: 'John Doe',
          lastMessage: 'Wir können gsd bis vor die whg fahren mit dem auto, das wird super!',
          lastTimestamp: 1517757771000
        },
        {
          id: 2,
          name: 'Aaron A. Aaronson',
          lastMessage: 'Wenn du meinst, aber ich bin mir nicht sicher :/',
          lastTimestamp: 1517864396599
        },
        {
          id: 3,
          name: 'Max Musterman',
          lastMessage: 'Ok 😊',
          lastTimestamp: 1517324400000
        }
      ]
    }
  },
  computed: {
    filteredConversations () {
      return this.conversations
        .filter(item => item.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
    }
  },
  methods: {
    weekDay (index) {
      let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return weekDays[index]
    },
    humanReadableTimestamp (timestamp) {
      let timestampDate = new Date(timestamp)
      let now = new Date()
      let todayAtMidnightTimestamp = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime()
      let dayInMs = 3600000 * 24

      if (timestamp >= todayAtMidnightTimestamp) {
        return ('' + (timestampDate.getHours())).padStart(2, '0') + ':' + ('' + (timestampDate.getMinutes())).padStart(2, '0')
      }

      if (timestamp >= todayAtMidnightTimestamp - dayInMs) {
        return 'Yesterday'
      }

      if (timestamp >= todayAtMidnightTimestamp - dayInMs * 6) {
        return this.weekDay(timestampDate.getDay())
      }

      return timestampDate.getFullYear() + '-' +
        ('' + (timestampDate.getMonth() + 1)).padStart(2, '0') + '-' +
        ('' + (timestampDate.getDate())).padStart(2, '0')
    }
  }
}
</script>

<style scoped>
ons-search-input {
  margin: 0 15px;
  width: calc(100% - 30px);
}

.list-item__subtitle {
  width: 150px;
}

.chevron-text {
  padding: 0 35px 18px 0;
  font-size: 12px;
  color: gray;
}
  
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
