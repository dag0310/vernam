export default class ImageToAscii {
  static convertImageToASCII(imageDataUrl: string, charactersPerLine: number, callback: any): void {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height

      if (context == null) {
        throw Error('Context is null.')
      }

      context.drawImage(img, 0, 0, img.width, img.height)

      const xIncrement = Math.floor(img.width / charactersPerLine)
      const yIncrement = xIncrement * 2
      // const asciiChars = '@%#*+=-:. '
      const asciiChars = '@&%QWNM0gB$#DR8mHXKAUbGOpV4d9h6PkqwSE2]ayjxY5Zoen[ult13If}C{iF|(7J)vTLs?z/*cr!+<>;=^,_:\'-.`'
      const asciiCharsFactor = asciiChars.length - 1

      let asciiString = ''
      for (let y = 0; y < img.height; y += yIncrement) {
        for (let x = 0; x < img.width; x += xIncrement) {
          const pixelData = context.getImageData(x, y, 1, 1).data
          const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3
          const index = Math.floor((brightness / 255) * asciiCharsFactor)
          asciiString += asciiChars[index]
        }
        asciiString += '\n'
      }
      callback(asciiString)
    }
    img.src = imageDataUrl
  }
}
