# Vernam
Perfect Secrecy* messenger app - developed using [Cordova](https://cordova.apache.org/) + [Vue.js](https://vuejs.org/) + [OnsenUI](https://onsen.io/) supporting Android and iOS.

![Vernam app icon](res/icon/android/icon-96-xhdpi.png)

# Usage
- Register with your phone number
- Add your contact
- Have your contact add you
- Refill your keys via QR code scanning in the app to send messages
- You can now send messages as long as the key hasn't run out
- Refill your keys as needed

**Minimum Requirements:**
- iOS: 9
- Android: 6.2.3

# Under the Hood
- Named after [Gilbert Vernam](https://en.wikipedia.org/wiki/Gilbert_Vernam), co-inventor of the one-time pad cipher.
- The app works with a symmetric stream cipher that allows for perfect secrecy* encryption aka a one-time pad. This app does not use any other encryption mechanisms which could weaken its security.
- Since keys are only used once and since they are as long as the message sent itself, they need to be refilled with your partner from time to time by scanning QR codes. The exchanged key data will be split among the partners so they can continue sending messages.
- Identification works using your phone's number, so you and other people can easily add each other.
- Integrity and authenticity is provided by prepending each message with the text "VERNAM" before encrypting it, which only the receiver can decrypt correctly, since only they are in possession of the private key as well.
- XOR encryption/decryption for the one-time pads and generation of random key bytes is performed using the [OTP Crypto](https://github.com/dag0310/otp-crypto) library.
- Keys should remain only on the devices, not uploaded to The Cloud. On iOS this is assured by providing a config flag; on Android this should not be necessary.
- The key exchange happens via a visual channel (QR code scanning), so be sure that you are in an environment where you know for sure that your key exchange cannot be eavesdropped upon (e.g. security cameras, spies, etc.) For maximum security you could do it like Solid Snake and hide underneath a cardboard box, where nobody should be able to see your smartphone screens.

## Known Flaws
- \* **No true randomness:** Technically the app does not guarantee perfect secrecy (yet), because it uses a CSPRNG (no true randomness). This problem could be mitigated in the future by providing further seeds from the smart phone's sensors for example.
- **DDoSing clients:** Since the [Vernam Backend](https://github.com/dag0310/vernam-backend) is completely open, it is easy to spam clients with fake messages which they will retrieve and which never will be deleted without manual intervention. Affected clients will ignore them though, since the encrypted text "VERNAM" must be included at the beginning. Messages sent by authentic senders will be deleted from the server by the receiver.

If you come across any other flaws, please create an issue or pull-request for this [README.md](README.md) file -- thank you :)

# Build Setup

## Dev environment
``` bash
# Install cordova
npm install -g cordova

# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```

## iOS
``` bash
# Add iOS platform
cordova platform add ios
```

Add the following permission usage description key-value-pairs to file "platforms/ios/Vernam/Vernam-Info.plist":
```
    <key>NSContactsUsageDescription</key>
    <string>In order to create conversations, please allow Vernam to access your contacts.</string>
    <key>NSCameraUsageDescription</key>
    <string>In order to scan QR codes, please allow Vernam to access your camera.</string>
```

``` bash
# Run it on your device (be sure you built the Vue.js app first using "npm run build")
cordova run ios
```

Hint: After starting the app for the first time, it is necessary to trust the developer application in the iOS Settings under General/Device Management.

## Android

``` bash
# Add Android platform
cordova platform add android

# Run it on your device (be sure you built the Vue.js app first using "npm run build")
cordova run android
```
