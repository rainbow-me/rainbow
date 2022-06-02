import c from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import Palette, { IPalette } from 'react-native-palette-full';

export default async function getDominantColorFromImage(
  imageUrl: string,
  colorToMeasureAgainst: string
) {
  if (IS_TESTING === 'true') return undefined;
  let colors: IPalette;
  if (/^http/.test(imageUrl)) {
    colors = await Palette.getNamedSwatchesFromUrl(imageUrl);
  } else {
    colors = await Palette.getNamedSwatches(imageUrl);
  }

  // react-native-palette keys for Android are not the same as iOS so we fix here
  if (android) {
    // @ts-expect-error ts-migrate(2740) FIXME: Type '{}' is missing the following properties from... Remove this comment to see the full error message
    colors = Object.keys(colors).reduce((acc, key) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
