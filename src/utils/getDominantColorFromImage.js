import c from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
import { IS_TESTING } from 'react-native-dotenv';
import Palette from 'react-native-palette-full';

export default async function getDominantColorFromImage(
  imageUrl,
  colorToMeasureAgainst
) {
  if (IS_TESTING === 'true') return undefined;
  let colors = await Palette.getNamedSwatchesFromUrl(imageUrl);

  //react-native-palette keys for Andriod are not the same as iOS so we fix here
  if (android) {
    colors = Object.keys(colors).reduce((acc, key) => {
      acc[key.toLowerCase()] = colors[key];
      return acc;
    }, {});
  }

  const color =
    colors.vibrant?.color ||
    colors.muted?.color ||
    colors.vibrantLight?.color ||
    colors.mutedLight?.color ||
    colors.mutedDark?.color ||
    colors.vibrantDark?.color;

  const fallbackColor =
    colors.muted?.color ||
    colors.vibrantLight?.color ||
    colors.mutedLight?.color ||
    colors.mutedDark?.color ||
    colors.vibrantDark?.color;

  if (colors.vibrant?.color) {
    const chillVibrant = makeColorMoreChill(
      colors.vibrant?.color,
      colorToMeasureAgainst
    );

    if (c.deltaE(colors.vibrant?.color, chillVibrant) < 13) {
      return chillVibrant;
    } else if (fallbackColor !== undefined && fallbackColor !== color) {
      const chillFallback = makeColorMoreChill(
        fallbackColor,
        colorToMeasureAgainst
      );

      if (fallbackColor === chillFallback) {
        return chillFallback;
      } else {
        return chillVibrant;
      }
    }
  }
  return makeColorMoreChill(color, colorToMeasureAgainst);
}
