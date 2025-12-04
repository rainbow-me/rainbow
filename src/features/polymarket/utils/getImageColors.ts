import makeColorMoreChill from 'make-color-more-chill';
import { getColors } from 'react-native-image-colors';

/**
 * TODO: add a persistent cache
 */
export async function getImageColors(imageUrl: string) {
  return await getColors(imageUrl, {
    fallback: '#000000',
    quality: 'lowest',
    cache: true,
  });
}

export async function getImagePrimaryColor(imageUrl: string) {
  let primaryColor = '#000000';
  try {
    const colors = await getImageColors(imageUrl);
    if (colors.platform === 'ios') {
      primaryColor = colors.primary;
    } else if (colors.platform === 'android') {
      primaryColor = colors.dominant;
    } else {
      primaryColor = colors.dominant;
    }
  } catch {
    primaryColor = '#000000';
  }
  return makeColorMoreChill(primaryColor, '#333333');
}

/**
 * In initial testing this was much slower, but the colors were much more accurate
 */

// const imgFactory = Skia.Image.MakeImageFromEncoded.bind(Skia.Image);

// export async function getEventColorSkia(imageUrl: string) {
//   const image = await loadData(imageUrl, imgFactory);
//   if (!image) return '#000000';
//   const pixels = image.readPixels();
//   return getAverageColor(pixels, image.width(), image.height());
// }

// const getAverageColor = (pixels: Uint8Array, width: number, height: number): string => {
//   const pixelSampleRate = 20;
//   let r = 0,
//     g = 0,
//     b = 0;
//   let sampledPixels = 0;

//   for (let y = 0; y < height; y += pixelSampleRate) {
//     for (let x = 0; x < width; x += pixelSampleRate) {
//       const i = (y * width + x) * 4;
//       r += pixels[i]!;
//       g += pixels[i + 1]!;
//       b += pixels[i + 2]!;
//       sampledPixels++;
//     }
//   }

//   r = Math.round(r / sampledPixels);
//   g = Math.round(g / sampledPixels);
//   b = Math.round(b / sampledPixels);

//   return `rgb(${r},${g},${b})`;
// };
