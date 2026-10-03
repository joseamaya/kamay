export const MAX_SPRITE_SIZE = 128

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      }
    } catch {
      // Some engines cannot decode every image through createImageBitmap;
      // fall back to an <img> element below.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('image_load'))
      element.src = url
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

/** Downscales an image file to a small sprite and encodes it as a data URL. */
export async function fileToSpriteDataUrl(file: File, maxSize = MAX_SPRITE_SIZE): Promise<string> {
  const { source, width, height, release } = await decode(file)
  try {
    const scale = Math.min(1, maxSize / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('no_canvas')
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    release()
  }
}
