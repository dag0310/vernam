# Vernam

Meet up, refill your one-time keys using QR code scanning and start texting.

![Vernam app icon](public/img/favicon-256x256.png)

## Usage
- Add your contact
- Have your contact add you
- Refill your keys via QR code scanning in the app to send messages
- You can now send messages as long as the key hasn't run out
- Refill your keys as needed

## Under the Hood
- Named after [Gilbert Vernam](https://en.wikipedia.org/wiki/Gilbert_Vernam), co-inventor of the one-time pad cipher.
- The app works with a symmetric stream cipher that allows for near perfect secrecy encryption using a pseudo one-time pad. This app does not use any other encryption mechanisms which could weaken its security.
- Since keys are only used once and since they are as long as the message sent itself, they need to be refilled with your contact from time to time by scanning QR codes. The exchanged key data will be split among the contacts so they can continue sending messages.
- Authenticity is provided by prepending each message with the text "VERNAM" before encrypting it, which only the receiver can decrypt correctly, since only they are in possession of the private key as well.
- XOR encryption/decryption for the pseudo one-time pads and generation of random key bytes is done using the [OTP Crypto](https://github.com/dag0310/otp-crypto) library.
- Keys shall remain only on the device's localStorage.
- The key exchange happens via a visual channel (QR code scanning), so be sure that you are in an environment where you know for sure that your key exchange cannot be eavesdropped upon (e.g. security cameras, spies, etc.) For maximum security you could do it like Solid Snake and hide underneath a cardboard box, where nobody should be able to see your smartphone screens.

## Development

Create `.env.development.local` and/or `.env.production.local` file in project root with content:
```
VITE_API_URL=<API_URL>
```

## Backend

- [Vernam Backend](https://github.com/dag0310/vernam-backend)

## Tech stack

- [Vue.js 3](https://vuejs.org/)
- [Ionic Framework](https://ionicframework.com)
