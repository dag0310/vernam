export type State = {
  id: string | null
  showEnablePushNotifications: boolean
  chats: Chat[]
  currentChatId: string | null
  lastTimestamp: number | null
  numQrCodes: number
  bytesPerQrCode: number
}

export type Chat = {
  id: string
  name: string
  messages: Message[]
  message: string
  ownKey: string
  otherKey: string
  otherId: string | null
  hasNewMessage: boolean
}

export type Message = {
  id: string
  own: boolean
  text: string
  timestamp: number
  synced: boolean
  base64Key?: string
  payload?: string
}

export type FilteredMessage = {
  id: string
  own: boolean
  text: string
  html: string
  timestamp: number
}

export type ParsedQrCode = {
  number: number
  bytes: Uint8Array
}

export type ParsedQrCodePassive = ParsedQrCode & {
  dataUrl: string
}

export type QrCodeData = {
  id: string
  qr: number
  qrT: number
  key: string
}

export type ApiMessageRequestBody = {
  id: string
  sender: string
  receiver: string
  payload: string
}

export type ApiMessageResponseBody = {
  id: string
  sender: string
  receiver: string
  payload: string
  timestamp: number
}
