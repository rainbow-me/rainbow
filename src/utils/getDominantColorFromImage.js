import c from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
import { IS_TESTING } from 'react-native-dotenv';
import Palette from 'react-native-palette-full';

export default async function getDominantColorFromImage(
  imageUrl,
  colorToMeasureAgainst
) {
  if (IS_TESTING === 'true') return undefined;
  const colors = await Palette.getNamedSwatchesFromUrl(imageUrl);

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
