import { defineStore } from 'pinia'

export default defineStore({
  id: 'global',
  persist: false,
  state: () => ({
    debugMode: false,
    debugString: '',
    pollingActive: true,
    currentChatId: null as string | null,
  }),
})
