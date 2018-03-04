# Vernam
Perfect Secrecy messenger app - developed using [Cordova](https://cordova.apache.org/) + [Vue.js](https://vuejs.org/) + [OnsenUI](https://onsen.io/) supporting Android and iOS.

![Vernam app icon](res/icon/android/icon-96-xhdpi.png)

# Usage
## Quick guide:
- Register with your phone number
- Add your contact
- Your contact adds you
- Refill your keys via QR code scanning in the app
- Good to go -- start messaging each other
- As long as the key hasn't run out, nobody should be able to decrypt your messages.

## Under the hood wisdom
- The app works with a symmetric stream cipher that allows for perfect secrecy encryption aka a one-time pad. This app does not use any other encryption mechanisms which could weaken its security.
- Since keys are only used once and they are as big as the message sent itself, they need to be refilled with your partner from time to time by scanning QR codes. The exchanged key will be split among the partners and they can continue sending messages.
- Identification works using your phone's number, so you and other people can easily add each other.
- Integrity and authenticity is provided by prepending each message with the text "VERNAM" before encrypting it, which only the receiver can decrypt correctly since only they are in possession of the private key as well.
- Keys should remain only on the devices, not uploaded to The Cloud. On iOS this is assured by providing a config flag, on Android this should not be necessary.
- Key exchange: Be sure to be in an environment where you know for sure that your QR code key exchange cannot be eavesdropped upon. For maximum security do it like Solid Snake and hop underneath a cardboard box.

## Known flaws
- **No true randomness:** Technically the app does not guarantee perfect secrecy yet, because it uses a CSPRNG (no true randomness). This problem could be mitigated in the future by providing further seeds from the smart phone's sensors for example.
- **DDoSing clients:** Since the [Vernam Backend](https://github.com/dag0310/vernam-backend) is completely open, it is easy to spam clients with fake messages which they will retrieve and which never will be deleted without manual intervention. Clients will ignore them though, since it is unlikely that the authentication secret text "VERNAM" is included in the spam message. Messages sent by authentic senders will be deleted by the receiver after successful delivery.

If you come across any other flaws, please create an issue or pull-request for this [README.md](README.md) file -- thank you :)

# Minimum Requirements
- iOS: 9
- Android: 6.2.3

# Build Setup

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

Add these key-value-pairs to this file: platforms/ios/Vernam/Vernam-Info.plist
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
