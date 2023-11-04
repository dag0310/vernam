# Vernam

Perfect Secrecy Messaging made simple.

Meet up, exchange your one-time pad (OTP) keys using QR code scanning and start texting with the most secure encryption method known to humanity.

![Vernam app icon](static/favicon.png)

## Usage
- Add your contact
- Have your contact add you
- Refill your keys via QR code scanning in the app to send messages
- You can now send messages as long as the key hasn't run out
- Refill your keys as needed

## Under the Hood
- Named after [Gilbert Vernam](https://en.wikipedia.org/wiki/Gilbert_Vernam), co-inventor of the one-time pad cipher.
- The app works with a symmetric stream cipher that allows for perfect secrecy encryption aka a one-time pad. This app does not use any other encryption mechanisms which could weaken its security.
- Since keys are only used once and since they are as long as the message sent itself, they need to be refilled with your partner from time to time by scanning QR codes. The exchanged key data will be split among the partners so they can continue sending messages.
- Authenticity is provided by prepending each message with the text "VERNAM" before encrypting it, which only the receiver can decrypt correctly, since only they are in possession of the private key as well.
- XOR encryption/decryption for the one-time pads and generation of random key bytes is performed using the [OTP Crypto](https://github.com/dag0310/otp-crypto) library.
- Keys shall remain only on the device's localStorage.
- The key exchange happens via a visual channel (QR code scanning), so be sure that you are in an environment where you know for sure that your key exchange cannot be eavesdropped upon (e.g. security cameras, spies, etc.) For maximum security you could do it like Solid Snake and hide underneath a cardboard box, where nobody should be able to see your smartphone screens.

## Known Flaws
- **No perfect secrecy when scanning active/passive:** Technically the app does not guarantee perfect secrecy when scanning in active and passive mode, because mobile devices usually use a CSPRNG (no true randomness). This problem could be mitigated in the future by providing further seeds from the smart phone's sensors for example. If both devices scan from external QR codes (active), which consist of random noise generated by a true random number generator, perfect secrecy may be achieved.
- **DDoSing clients:** Since the [Vernam Backend](https://github.com/dag0310/vernam-backend) is completely open, it is easy to spam clients with fake messages which they will retrieve and which never will be deleted without manual intervention. Affected clients will ignore them though, since the encrypted text "VERNAM" must be included at the beginning. Messages sent by authentic senders will be deleted from the server by the receiver.

If you come across any other flaws, please create an issue or pull-request for this [README.md](README.md) file -- thank you :)

## Development

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

## Tech stack

- [Vue.js](https://vuejs.org/)
- [OnsenUI](https://onsen.io/)
