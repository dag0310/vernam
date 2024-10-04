import { toastController, alertController, isPlatform } from '@ionic/vue'
import { AxiosError } from 'axios'

import { Message, ParsedQrCode } from './types'
import i18n from './i18n'

const { t } = i18n.global

export const AUTH_PREAMBLE = 'VERNAM'

export async function showToast(message: string, duration = 3000, position: 'top' | 'middle' | 'bottom' = 'bottom'): Promise<void> {
  (await toastController.create({ message, duration, position })).present()
}

export function handleUnexpectedError(error: AxiosError, prefix = ''): void {
  console.error(error)
  const status = error.response?.status ?? 'NO_STATUS'
  const message = prefix + ((error.response?.data as any)?.message ?? 'NO_MESSAGE')
  showToast(t('unexpectedError', { status, message }))
}

export function buildNotificationPermissionNotSupportedMessage(): string {
  if (isPlatform('ios')) {
    return t('notificationPermissionNotSupportedIos') + (isPlatform('pwa') ? ' iOS Version 16.4+' : '')
  }
  if (isPlatform('android')) {
    return t('notificationPermissionNotSupportedAndroid') + (isPlatform('pwa') ? ' Google Chrome Version 50+' : '')
  }
  return t('notificationPermissionNotSupportedOther')
}

export function isMessageVisible(message: Message): boolean {
  return !message.own || message.synced || message.synced === undefined
}

export function humanizeDate(timestamp: number): { isToday: boolean, dateText: string, timeText: string } {
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
    dateText = t('today')
  } else if (timestamp >= yesterdayStartOfDay.getTime()) {
    dateText = t('yesterday')
  } else if (timestamp >= sixDaysAgoStartOfDay.getTime()) {
    dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }).format(date)
  } else if (date.getFullYear() === now.getFullYear()) {
    dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }).format(date)
  } else {
    dateText = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' }).format(date)
  }

  return { isToday, dateText, timeText }
}

export function buildTotalKeyByteArray(qrCodes: ParsedQrCode[]): Uint8Array {
  const byteArrays = qrCodes.slice().sort((a, b) => a.number - b.number).map(qrCode => qrCode.bytes)
  const flattenedByteArrays = new Uint8Array(byteArrays.reduce((acc, arr) => acc + arr.length, 0))
  let offset = 0
  for (const byteArray of byteArrays) {
    flattenedByteArrays.set(byteArray, offset)
    offset += byteArray.length
  }
  return flattenedByteArrays
}

export async function showIntroDialog(): Promise<void> {
  await (await alertController.create({
    header: t('introTitle'),
    message: t('introText'),
    buttons: [
      {
        text: t('alright'),
        role: 'cancel',
      },
    ],
  })).present()
}
