import { defineComponent } from 'vue'
import { toastController, alertController, isPlatform } from '@ionic/vue'
import { AxiosError } from 'axios'

import { Message, ParsedQrCode } from './types'

export default defineComponent({
  data(): {
    AUTH_PREAMBLE: string
  } {
    return {
      AUTH_PREAMBLE: 'VERNAM',
    }
  },
  methods: {
    async showToast(message: string, duration = 3000, position: 'top' | 'middle' | 'bottom' = 'bottom') {
      (await toastController.create({ message, duration, position })).present()
    },
    handleUnexpectedError(error: AxiosError, prefix = '') {
      console.error(error)
      const status = error.response?.status ?? 'NO_STATUS'
      const message = prefix + ((error.response?.data as any)?.message ?? 'NO_MESSAGE')
      this.showToast(this.$t('unexpectedError', { status, message }))
    },
    buildNotificationPermissionNotSupportedMessage() {
      if (isPlatform('ios')) {
        return this.$t('notificationPermissionNotSupportedIos') + (isPlatform('pwa') ? ' iOS Version 16.4+' : '')
      }
      if (isPlatform('android')) {
        return this.$t('notificationPermissionNotSupportedAndroid') + (isPlatform('pwa') ? ' Google Chrome Version 50+' : '')
      }
      return this.$t('notificationPermissionNotSupportedOther')
    },
    isMessageVisible(message: Message) {
      return !message.own || message.synced || message.synced === undefined
    },
    humanizeDate(timestamp: number) {
      const date = new Date(timestamp)
      const timeText = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' }).format(date)
      const now = new Date()
      const todayStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterdayStartOfDay = new Date(todayStartOfDay)
      yesterdayStartOfDay.setDate(yesterdayStartOfDay.getDate() - 1)
      const sixDaysAgoStartOfDay = new Date(todayStartOfDay)
      sixDaysAgoStartOfDay.setDate(sixDaysAgoStartOfDay.getDate() - 6)

      let isToday = false
      let dateText

      if (timestamp >= todayStartOfDay.getTime()) {
        isToday = true
        dateText = this.$t('today')
      } else if (timestamp >= yesterdayStartOfDay.getTime()) {
        dateText = this.$t('yesterday')
      } else if (timestamp >= sixDaysAgoStartOfDay.getTime()) {
        dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }).format(date)
      } else if (date.getFullYear() === now.getFullYear()) {
        dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }).format(date)
      } else {
        dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' }).format(date)
      }

      return { isToday, dateText, timeText }
    },
    buildTotalKeyByteArray(qrCodes: ParsedQrCode[]) {
      const byteArrays = qrCodes.slice().sort((a, b) => a.number - b.number).map(qrCode => qrCode.bytes)
      const flattenedByteArrays = new Uint8Array(byteArrays.reduce((acc, arr) => acc + arr.length, 0))
      let offset = 0
      for (const byteArray of byteArrays) {
        flattenedByteArrays.set(byteArray, offset)
        offset += byteArray.length
      }
      return flattenedByteArrays
    },
    async showIntroDialog() {
      await (await alertController.create({
        header: this.$t('introTitle'),
        message: this.$t('introText'),
        buttons: [
          {
            text: this.$t('alright'),
            role: 'cancel',
          },
        ],
      })).present()
    },
  },
})
